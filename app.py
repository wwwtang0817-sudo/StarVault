import base64
import json
import mimetypes
import os
import re
import sqlite3
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from contextlib import closing
from datetime import datetime, timezone
from html import escape as html_escape
from html import unescape
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


def env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parent / ".env.local"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value[:1] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


load_local_env()


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "knowledge.db"
PLATFORM_PORT = os.environ.get("PORT", "").strip()
HOST = os.environ.get("APP_HOST") or ("0.0.0.0" if PLATFORM_PORT else "127.0.0.1")
PORT = int(os.environ.get("APP_PORT") or PLATFORM_PORT or "8000")
READ_ONLY_MODE = env_flag("READ_ONLY_MODE", False)
READ_ONLY_MESSAGE = "当前为 demo 预览版本，非本人不可新增、修改或删除内容。"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", OPENAI_MODEL or "gpt-4.1-mini")
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "").strip()
DASHSCOPE_MODEL = os.environ.get("DASHSCOPE_MODEL", "qwen-plus")
DASHSCOPE_VISION_MODEL = os.environ.get("DASHSCOPE_VISION_MODEL", "qwen-vl-ocr")
DASHSCOPE_BASE_URL = os.environ.get(
    "DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
).rstrip("/")
AI_PROVIDER = os.environ.get("AI_PROVIDER", "").strip().lower()
MAX_XHS_IMAGES = 9
MAX_OCR_IMAGE_BYTES = 6 * 1024 * 1024


def now_iso() -> str:
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    ensure_dirs()
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS contents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT NOT NULL,
                note TEXT DEFAULT '',
                source_url TEXT DEFAULT '',
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS content_categories (
                content_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (content_id, category_id),
                FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );
            """
        )
        seed_demo_data(conn)
        conn.commit()


def seed_demo_data(conn: sqlite3.Connection) -> None:
    existing = conn.execute("SELECT COUNT(*) AS count FROM contents").fetchone()
    if existing and existing["count"] > 0:
        return

    demo_items = [
        {
            "title": "Vibe Coding 四步工作流",
            "body": (
                "这条内容围绕 Vibe Coding 的日常推进方式展开，核心是先把目标说清，再逐步把模糊任务转成可以验证的小步骤。\n\n"
                "第一步是明确要解决的问题和最终产出，避免一开始就陷入工具细节。\n\n"
                "第二步是拆解路径，把需求拆成几个短周期动作，例如搭骨架、补功能、再做验证。\n\n"
                "第三步是快速验证，每一步都尽量在很短时间内得到反馈，而不是一次性写完整套方案。\n\n"
                "第四步是回收沉淀，把有效提示词、流程和踩坑记录整理下来，形成下一次可复用的方法。"
            ),
            "note": "适合放在首页做演示，也适合验证搜索“工作流”时的高亮效果。",
            "source_url": "https://www.xiaohongshu.com/explore/demo-vibe-coding",
            "created_at": "2026-03-28T09:30:00+08:00",
            "categories": ["AI Coding", "待实施"],
        },
        {
            "title": "腾讯产品运营面试经验",
            "body": (
                "内容主要整理了一次产品运营岗位的面试过程，重点不在情绪化复盘，而在于每一轮面试关注点的区别。\n\n"
                "一面更偏业务理解和过往项目经验，例如活动目标怎么定、效果如何复盘、跨部门协作里自己承担了什么。\n\n"
                "二面更看重分析能力和结构化表达，尤其会追问数据指标为什么这样定，以及项目拆解是否有清晰的方法。\n\n"
                "如果把这类经验放进知识库，价值在于后续可以快速回看题型分布，而不是重新读一遍长帖。"
            ),
            "note": "用来验证“面试”“复盘”关键词搜索。",
            "source_url": "https://www.xiaohongshu.com/explore/demo-interview",
            "created_at": "2026-03-27T21:10:00+08:00",
            "categories": ["面试经验", "产品运营"],
        },
        {
            "title": "Claude 账号注册攻略",
            "body": (
                "这条内容围绕 Claude 账号注册时最常遇到的问题做了整理，包括注册前准备、地区限制和常见失败点。\n\n"
                "第一部分解释需要准备的基础条件，例如邮箱、网络环境和验证方式。\n\n"
                "第二部分总结注册过程中常见卡点，比如验证码收不到、页面报错或地区校验不过。\n\n"
                "第三部分补充了一些经验性建议，例如先确认流程是否变化，再决定是否继续折腾当前方案。"
            ),
            "note": "用来演示工具类内容的整理方式。",
            "source_url": "https://www.xiaohongshu.com/explore/demo-claude-signup",
            "created_at": "2026-03-26T14:20:00+08:00",
            "categories": ["AI Coding", "效率工具"],
        },
    ]

    for item in demo_items:
        cursor = conn.execute(
            """
            INSERT INTO contents (title, body, created_at, note, source_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item["title"],
                item["body"],
                item["created_at"],
                item["note"],
                item["source_url"],
                item["created_at"],
            ),
        )
        content_id = cursor.lastrowid
        category_ids = ensure_categories(conn, item["categories"])
        conn.executemany(
            "INSERT INTO content_categories (content_id, category_id) VALUES (?, ?)",
            [(content_id, category_id) for category_id in category_ids],
        )


def normalize_spaces(value: str) -> str:
    return re.sub(r"[ \t]+", " ", value or "").strip()


def normalize_multiline(value: str) -> str:
    text = value.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_long_paragraph(paragraph: str, threshold: int = 110) -> List[str]:
    text = normalize_spaces(paragraph)
    if len(text) <= threshold:
        return [text]

    text = re.sub(r"\s*([0-9]{1,2}[.、])\s*", r"\n\1 ", text)
    text = re.sub(r"\s*([一二三四五六七八九十]+[、.])\s*", r"\n\1 ", text)
    pieces = [part.strip() for part in text.split("\n") if part.strip()]
    if len(pieces) > 1:
        result = []
        for piece in pieces:
            if len(piece) > threshold and re.search(r"[。；;！!?]", piece):
                result.extend(split_long_paragraph(piece, threshold))
            else:
                result.append(piece)
        return result

    sentences = re.split(r"(?<=[。！？!?；;])\s*", text)
    sentences = [sentence.strip() for sentence in sentences if sentence.strip()]
    if len(sentences) <= 1:
        return [text]

    groups = []
    current = ""
    for sentence in sentences:
        candidate = f"{current}{sentence}" if current else sentence
        if current and len(candidate) > threshold:
            groups.append(current.strip())
            current = sentence
        else:
            current = candidate
    if current:
        groups.append(current.strip())
    return groups or [text]


def format_readable_line(line: str) -> str:
    text = line.strip()
    if not text:
        return ""

    if re.match(r"^[0-9]{1,2}[.、]\s*", text):
        normalized = re.sub(r"^[0-9]{1,2}[.、]\s*", "", text)
        return f"　　• {normalized}"
    if re.match(r"^[一二三四五六七八九十]+[、.]\s*", text):
        normalized = re.sub(r"^[一二三四五六七八九十]+[、.]\s*", "", text)
        return f"　　• {normalized}"
    if re.match(r"^[-•·]\s*", text):
        normalized = re.sub(r"^[-•·]\s*", "• ", text)
        return f"　　{normalized}"
    return text


def polish_organized_body(value: str) -> str:
    text = normalize_multiline(value)
    if not text:
        return text

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*([0-9]{1,2}[.、])\s*", r"\n\1 ", text)
    text = re.sub(r"\s*([一二三四五六七八九十]+[、.])\s*", r"\n\1 ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    polished_paragraphs: List[str] = []
    for paragraph in [part.strip() for part in text.split("\n\n") if part.strip()]:
        polished_paragraphs.extend(split_long_paragraph(paragraph))

    formatted_lines: List[str] = []
    for paragraph in polished_paragraphs:
        if not paragraph.strip():
            continue
        for line in paragraph.split("\n"):
            formatted = format_readable_line(line)
            if formatted:
                formatted_lines.append(formatted)
    result = "\n".join(line for line in formatted_lines if line)
    return normalize_multiline(result)


def parse_datetime_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip()
    patterns = [
        r"(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:日)?)",
        r"(\d{4}-\d{2}-\d{2})",
        r"(\d{4}/\d{1,2}/\d{1,2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, value)
        if match:
            return match.group(1)
    return None


def extract_url(text: str) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"https?://[^\s]+", text)
    if not match:
        return None
    return match.group(0).rstrip("。；，,)")


def looks_like_xiaohongshu(url: str) -> bool:
    netloc = urllib.parse.urlparse(url).netloc.lower()
    domains = ("xiaohongshu.com", "xhslink.com")
    return any(domain in netloc for domain in domains)


def looks_like_wechat_article(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    netloc = parsed.netloc.lower()
    return "mp.weixin.qq.com" in netloc


def html_to_text(raw_html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", raw_html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()


def extract_meta(html: str, key: str, attr: str = "property") -> Optional[str]:
    pattern = rf'<meta[^>]+{attr}=["\']{re.escape(key)}["\'][^>]+content=["\'](.*?)["\']'
    match = re.search(pattern, html, flags=re.I | re.S)
    if match:
        return unescape(match.group(1)).strip()
    return None


def extract_between(pattern: str, text: str) -> Optional[str]:
    match = re.search(pattern, text, flags=re.I | re.S)
    if match:
        return unescape(match.group(1)).strip()
    return None


def decode_escaped_html_urls(raw_html: str) -> str:
    text = raw_html.replace("\\/", "/")
    text = text.replace("\\u002F", "/")
    text = text.replace("\\u002f", "/")
    text = text.replace("&amp;", "&")
    return text


def normalize_image_url(url: str) -> str:
    candidate = unescape(url or "").strip().strip('"').strip("'")
    candidate = candidate.replace("\\/", "/").replace("\\u002F", "/").replace("\\u002f", "/")
    if candidate.startswith("//"):
        candidate = f"https:{candidate}"
    return candidate


def looks_like_image_url(url: str) -> bool:
    candidate = normalize_image_url(url).lower()
    if not candidate.startswith("http"):
        return False
    if any(token in candidate for token in (".mp4", ".mov", ".m3u8", ".mp3", ".gifv", ".js", ".css", ".woff", ".ttf", ".ico")):
        return False
    if "fe-static.xhscdn.com" in candidate:
        return False
    parsed = urllib.parse.urlparse(candidate)
    if not parsed.path or parsed.path == "/":
        return False
    image_tokens = (
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".heic",
        "imageview2",
        "format/jpg",
        "format/png",
        "format/webp",
        "xhscdn.com",
    )
    return any(token in candidate for token in image_tokens)


def xhs_image_canonical_key(url: str) -> str:
    candidate = normalize_image_url(url)
    path = urllib.parse.urlparse(candidate).path
    basename = path.rsplit("/", 1)[-1]
    if "!" in basename:
        basename = basename.split("!", 1)[0]
    return basename or path


def extract_xiaohongshu_image_urls(html: str) -> List[str]:
    decoded = decode_escaped_html_urls(html)
    candidates: List[str] = []

    meta_image = (
        extract_meta(decoded, "og:image")
        or extract_meta(decoded, "twitter:image", attr="name")
    )
    if meta_image:
        candidates.append(meta_image)

    patterns = [
        r'"(?:urlDefault|urlPre)"\s*:\s*"(https?:\/\/[^"]+)"',
        r'"url"\s*:\s*"(https?:\/\/sns-webpic[^"]+)"',
        r'"(?:url|image|imageURL|originImageUrl|displayImageUrl|masterUrl|originUrl)"\s*:\s*"(https?:\/\/[^"]+)"',
        r'https?:\/\/[^"\'<>\s]+',
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, decoded, flags=re.I):
            value = match.group(1) if match.lastindex else match.group(0)
            candidates.append(value)

    unique_urls: List[str] = []
    canonical_to_index: Dict[str, int] = {}
    for candidate in candidates:
        url = normalize_image_url(candidate)
        if not looks_like_image_url(url):
            continue
        if "avatar" in url.lower():
            continue
        key = xhs_image_canonical_key(url)
        existing_index = canonical_to_index.get(key)
        if existing_index is not None:
            existing_url = unique_urls[existing_index]
            if "!nd_dft" in url and "!nd_dft" not in existing_url:
                unique_urls[existing_index] = url
            continue
        canonical_to_index[key] = len(unique_urls)
        unique_urls.append(url)
        if len(unique_urls) >= MAX_XHS_IMAGES:
            break
    return unique_urls


def fetch_binary_to_memory(url: str, referer: Optional[str] = None) -> Tuple[bytes, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            **({"Referer": referer} if referer else {}),
        },
    )
    with urllib.request.urlopen(request, timeout=18) as response:
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip() or "application/octet-stream"
        content_length = response.headers.get("Content-Length")
        if content_length and content_length.isdigit() and int(content_length) > MAX_OCR_IMAGE_BYTES:
            raise ValueError("图片过大，已跳过 OCR。")
        data = response.read(MAX_OCR_IMAGE_BYTES + 1)
        if len(data) > MAX_OCR_IMAGE_BYTES:
            raise ValueError("图片过大，已跳过 OCR。")
    return data, content_type


def image_bytes_to_data_url(image_bytes: bytes, content_type: str, source_url: str) -> str:
    mime = content_type or mimetypes.guess_type(source_url)[0] or "image/jpeg"
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def extract_output_text(response_data: Dict[str, object]) -> str:
    output_text = response_data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()
    for item in response_data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
    choices = response_data.get("choices", [])
    if isinstance(choices, list):
        for choice in choices:
            if not isinstance(choice, dict):
                continue
            message = choice.get("message") or {}
            if not isinstance(message, dict):
                continue
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()
    return ""


def ocr_images_with_dashscope(image_urls: List[str], referer: Optional[str] = None) -> str:
    if not DASHSCOPE_API_KEY or not image_urls:
        return ""

    content: List[Dict[str, object]] = [
        {
            "type": "text",
            "text": (
                "请提取这些图片里肉眼可见的中文和英文文字。"
                "要求：按图片顺序输出；尽量保留换行；忽略纯装饰元素；"
                "如果图片没有有意义文字，就写“无文字”。不要总结，只做文字提取。"
            ),
        }
    ]

    valid_image_count = 0
    for index, image_url in enumerate(image_urls[:MAX_XHS_IMAGES], start=1):
        try:
            image_bytes, content_type = fetch_binary_to_memory(image_url, referer=referer)
        except Exception:
            continue
        valid_image_count += 1
        content.append({"type": "text", "text": f"第 {index} 张图片"})
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": image_bytes_to_data_url(image_bytes, content_type, image_url)},
            }
        )

    if not valid_image_count:
        return ""

    payload = {
        "model": DASHSCOPE_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": content,
            }
        ],
    }
    request = urllib.request.Request(
        f"{DASHSCOPE_BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
    return normalize_multiline(extract_output_text(data))


def ocr_images_with_openai(image_urls: List[str], referer: Optional[str] = None) -> str:
    if not OPENAI_API_KEY or not image_urls:
        return ""

    content = [
        {
            "type": "input_text",
            "text": (
                "请提取这些图片里肉眼可见的中文和英文文字。"
                "要求：按图片顺序输出；尽量保留换行；忽略纯装饰元素；"
                "如果图片没有有意义文字，就写“无文字”。不要总结，只做文字提取。"
            ),
        }
    ]

    valid_image_count = 0
    for index, image_url in enumerate(image_urls[:MAX_XHS_IMAGES], start=1):
        try:
            image_bytes, content_type = fetch_binary_to_memory(image_url, referer=referer)
        except Exception:
            continue
        valid_image_count += 1
        content.append({"type": "input_text", "text": f"第 {index} 张图片"})
        content.append(
            {
                "type": "input_image",
                "image_url": image_bytes_to_data_url(image_bytes, content_type, image_url),
            }
        )

    if not valid_image_count:
        return ""

    payload = {
        "model": OPENAI_VISION_MODEL,
        "input": [
            {
                "role": "user",
                "content": content,
            }
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
    return normalize_multiline(extract_output_text(data))


def ocr_images(image_urls: List[str], referer: Optional[str] = None) -> str:
    if DASHSCOPE_API_KEY:
        return ocr_images_with_dashscope(image_urls, referer=referer)
    if OPENAI_API_KEY:
        return ocr_images_with_openai(image_urls, referer=referer)
    return ""


def get_xhs_ocr_status(image_urls: List[str], image_ocr_text: str) -> str:
    if not image_urls:
        return "未识别到可用图片"
    if DASHSCOPE_API_KEY:
        if image_ocr_text:
            return f"已完成 {len(image_urls)} 张图片 OCR（阿里 qwen-vl-ocr）"
        return "已识别图片，但阿里 OCR 未返回有效文字"
    if not OPENAI_API_KEY:
        return "未配置 OPENAI_API_KEY，已跳过图片 OCR"
    if image_ocr_text:
        return f"已完成 {len(image_urls)} 张图片 OCR"
    return "已识别图片，但 OCR 未返回有效文字"


def merge_extracted_and_ocr_text(source_body: str, image_ocr_text: str) -> str:
    clean_body = normalize_multiline(source_body or "")
    clean_ocr = normalize_multiline(image_ocr_text or "")
    if clean_body and clean_ocr:
        return f"{clean_body}\n\n图片文字：\n{clean_ocr}"
    return clean_body or clean_ocr


def extract_wechat_body_html(html: str) -> Optional[str]:
    match = re.search(r'<[^>]+id=["\']js_content["\'][^>]*>', html, flags=re.I)
    if not match:
        return None
    start = match.end()
    candidates = [
        re.search(r'<section[^>]+class=["\'][^"\']*meta_content', html[start:], flags=re.I),
        re.search(r'<div[^>]+id=["\']js_tags["\']', html[start:], flags=re.I),
        re.search(r'<div[^>]+class=["\'][^"\']*original_area_primary', html[start:], flags=re.I),
        re.search(r'<script\b', html[start:], flags=re.I),
    ]
    ends = [start + candidate.start() for candidate in candidates if candidate]
    end = min(ends) if ends else len(html)
    return html[start:end].strip()


def clean_wechat_body(text: str) -> str:
    lines = [normalize_spaces(line) for line in normalize_multiline(text).split("\n")]
    filtered = []
    seen = set()
    blacklist = (
        "微信扫一扫",
        "预览时标签不可点",
        "继续滑动看下一个",
        "喜欢此内容的人还喜欢",
        "分享",
        "收藏",
        "点赞",
        "在看",
    )
    for line in lines:
        if not line:
            continue
        if any(token in line for token in blacklist):
            continue
        if line in seen:
            continue
        seen.add(line)
        filtered.append(line)
    return normalize_multiline("\n".join(filtered))


def parse_wechat_publish_time(html: str) -> Optional[str]:
    timestamp_text = (
        extract_between(r"var\s+ct\s*=\s*[\"']?(\d{10})[\"']?", html)
        or extract_between(r'"publish_time"\s*:\s*"([^"]+)"', html)
        or extract_meta(html, "article:published_time")
    )
    if not timestamp_text:
        return None
    if timestamp_text.isdigit() and len(timestamp_text) == 10:
        return datetime.fromtimestamp(int(timestamp_text)).astimezone().date().isoformat()
    return parse_datetime_text(timestamp_text)


def fetch_xiaohongshu_content(link_input: str) -> Dict[str, Optional[str]]:
    url = extract_url(link_input or "")
    if not url:
        raise ValueError("没有识别到有效链接。")
    if not looks_like_xiaohongshu(url):
        raise ValueError("目前 MVP 只支持小红书分享链接。")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            raw = response.read()
            content_type = response.headers.get_content_charset() or "utf-8"
            html = raw.decode(content_type, errors="ignore")
            final_url = response.geturl()
    except urllib.error.HTTPError as exc:
        raise ValueError(f"链接抓取失败（HTTP {exc.code}）。") from exc
    except urllib.error.URLError as exc:
        raise ValueError("无法访问该链接，请稍后重试或改用手动粘贴。") from exc

    title = (
        extract_meta(html, "og:title")
        or extract_meta(html, "twitter:title", attr="name")
        or extract_between(r"<title>(.*?)</title>", html)
        or extract_between(r'"title"\s*:\s*"([^"]+)"', html)
    )
    body = (
        extract_meta(html, "description", attr="name")
        or extract_meta(html, "og:description")
        or extract_between(r'"desc"\s*:\s*"([^"]+)"', html)
        or extract_between(r'"content"\s*:\s*"([^"]+)"', html)
    )
    published_at = (
        extract_meta(html, "article:published_time")
        or extract_between(r'"publishTime"\s*:\s*"([^"]+)"', html)
        or extract_between(r"<time[^>]*datetime=['\"](.*?)['\"]", html)
    )

    if not title and not body:
        body_text = html_to_text(html)
        if len(body_text) > 30:
            body = body_text[:4000]

    if not title and body:
        title = normalize_spaces(body.split("\n", 1)[0])[:40]

    if not body:
        raise ValueError("暂时没能稳定提取小红书正文，请改用手动粘贴全文继续整理。")

    image_urls = extract_xiaohongshu_image_urls(html)
    image_ocr_text = ""
    if image_urls:
        try:
            image_ocr_text = ocr_images(image_urls, referer=final_url)
        except Exception:
            image_ocr_text = ""
    ocr_status = get_xhs_ocr_status(image_urls, image_ocr_text)

    merged_source_body = merge_extracted_and_ocr_text(body or "", image_ocr_text)

    return {
        "source_url": final_url,
        "source_title": normalize_spaces(title or ""),
        "source_body": normalize_multiline(body or ""),
        "merged_source_body": merged_source_body,
        "image_urls": image_urls,
        "image_ocr_text": image_ocr_text,
        "ocr_status": ocr_status,
        "published_at": parse_datetime_text(published_at),
    }


def fetch_wechat_content(link_input: str) -> Dict[str, Optional[str]]:
    url = extract_url(link_input or "")
    if not url:
        raise ValueError("没有识别到有效链接。")
    if not looks_like_wechat_article(url):
        raise ValueError("目前公众号导入只支持微信文章链接。")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://mp.weixin.qq.com/",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            raw = response.read()
            charset = response.headers.get_content_charset() or "utf-8"
            html = raw.decode(charset, errors="ignore")
            final_url = response.geturl()
    except urllib.error.HTTPError as exc:
        raise ValueError(f"公众号链接抓取失败（HTTP {exc.code}）。") from exc
    except urllib.error.URLError as exc:
        raise ValueError("无法访问该公众号链接，请稍后重试或改用手动粘贴。") from exc

    title = (
        extract_meta(html, "og:title")
        or extract_meta(html, "twitter:title", attr="name")
        or extract_between(r"var\s+msg_title\s*=\s*'([^']+)'", html)
        or extract_between(r'var\s+msg_title\s*=\s*"([^"]+)"', html)
        or extract_between(r"<title>(.*?)</title>", html)
    )
    body_html = extract_wechat_body_html(html)
    body = clean_wechat_body(html_to_text(body_html or "")) if body_html else ""
    if not body:
        body = (
            extract_meta(html, "description", attr="name")
            or extract_meta(html, "og:description")
            or ""
        )
    published_at = parse_wechat_publish_time(html)

    if not body:
        raise ValueError("暂时没能稳定提取公众号正文，请改用手动粘贴全文继续整理。")

    return {
        "source_url": final_url,
        "source_title": normalize_spaces(title or ""),
        "source_body": normalize_multiline(body),
        "published_at": published_at,
    }


def fetch_link_content(link_input: str) -> Dict[str, Optional[str]]:
    url = extract_url(link_input or "")
    if not url:
        raise ValueError("没有识别到有效链接。")
    if looks_like_xiaohongshu(url):
        return fetch_xiaohongshu_content(link_input)
    if looks_like_wechat_article(url):
        return fetch_wechat_content(link_input)
    raise ValueError("目前链接模式支持小红书分享链接和公众号文章链接。")


def heuristically_parse_manual_input(raw_text: str) -> Dict[str, Optional[str]]:
    text = normalize_multiline(raw_text)
    if not text:
        raise ValueError("请先粘贴要整理的内容。")

    lines = [normalize_spaces(line) for line in text.split("\n") if normalize_spaces(line)]
    if not lines:
        raise ValueError("粘贴内容为空。")

    published_at = None
    title = ""
    body_lines = lines[:]

    if lines and len(lines[0]) <= 42:
        title = lines[0]
        body_lines = lines[1:] or lines[:]

    for idx, line in enumerate(lines[:6]):
        maybe_date = parse_datetime_text(line)
        if maybe_date:
            published_at = maybe_date
            if line in body_lines:
                body_lines = [item for item in body_lines if item != line]
            if not title and idx == 0 and len(lines) > 1:
                title = lines[1][:42]
            break

    body = normalize_multiline("\n".join(body_lines))
    if not title:
        first_sentence = re.split(r"[。！？.!?]", body, maxsplit=1)[0]
        title = normalize_spaces(first_sentence)[:28] or "未命名内容"

    return {
        "source_url": "",
        "source_title": title,
        "source_body": body,
        "published_at": published_at,
    }


def score_category(name: str, text: str) -> int:
    name = name.lower()
    text = text.lower()
    score = 0
    for token in re.split(r"[\s/、·_-]+", name):
        token = token.strip()
        if token and token in text:
            score += 2
    if name in text:
        score += 4
    return score


def fallback_categories(text: str, existing_categories: List[str]) -> List[str]:
    text_lower = text.lower()
    keyword_map = {
        "AI Coding": ["ai", "coding", "代码", "编程", "cursor", "claude", "vibe"],
        "面试经验": ["面试", "简历", "offer", "求职", "运营面试", "产品面试"],
        "产品运营": ["产品", "运营", "增长", "策略", "用户研究"],
        "效率工具": ["工具", "效率", "工作流", "模版", "自动化"],
        "待实施": ["todo", "待做", "待实施", "落地", "实操"],
    }

    if existing_categories:
        scored = sorted(
            (
                (score_category(category, text), category)
                for category in existing_categories
            ),
            reverse=True,
        )
        chosen = [name for score, name in scored if score > 0][:2]
        if chosen:
            return chosen

    for category, keywords in keyword_map.items():
        if any(keyword.lower() in text_lower for keyword in keywords):
            return [category]
    return ["待整理"]


def fallback_organize(
    source_title: str,
    source_body: str,
    existing_categories: List[str],
) -> Dict[str, object]:
    title = normalize_spaces(source_title) or "未命名内容"
    paragraphs = [segment.strip() for segment in source_body.split("\n") if segment.strip()]
    compact_body = "\n\n".join(paragraphs[:12]).strip()
    if not compact_body:
        compact_body = source_body.strip()
    return {
        "organized_title": title[:36],
        "organized_body": polish_organized_body(compact_body),
        "categories": fallback_categories(f"{title}\n{source_body}", existing_categories),
    }

def current_ai_provider() -> str:
    if AI_PROVIDER in {"openai", "dashscope"}:
        return AI_PROVIDER
    if DASHSCOPE_API_KEY:
        return "dashscope"
    if OPENAI_API_KEY:
        return "openai"
    return "none"


def current_ai_key() -> str:
    provider = current_ai_provider()
    if provider == "dashscope":
        return DASHSCOPE_API_KEY
    if provider == "openai":
        return OPENAI_API_KEY
    return ""


def current_ai_model() -> str:
    provider = current_ai_provider()
    if provider == "dashscope":
        return DASHSCOPE_MODEL
    return OPENAI_MODEL


def extract_json_object(text: str) -> Dict:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("AI 返回为空。")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("AI 返回内容无法解析。")
    return json.loads(match.group(0))


def call_openai_json(system_prompt: str, user_prompt: str, schema_name: str, schema: Dict) -> Dict:
    payload = {
        "model": current_ai_model(),
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user_prompt}],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": schema,
            }
        },
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {current_ai_key()}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        data = json.loads(response.read().decode("utf-8"))
    output_text = data.get("output_text")
    if output_text:
        return json.loads(output_text)
    for item in data.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if text:
                return json.loads(text)
    raise ValueError("AI 返回内容无法解析。")


def call_dashscope_json(system_prompt: str, user_prompt: str, schema_name: str, schema: Dict) -> Dict:
    instruction = (
        "请严格返回一个 JSON 对象，不要输出任何额外解释。"
        f"JSON 对象名称是 {schema_name}，字段结构必须符合下面的 JSON Schema：\n"
        f"{json.dumps(schema, ensure_ascii=False)}"
    )
    payload = {
        "model": current_ai_model(),
        "messages": [
            {"role": "system", "content": f"{system_prompt}\n\n{instruction}"},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        f"{DASHSCOPE_BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {current_ai_key()}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        data = json.loads(response.read().decode("utf-8"))
    choices = data.get("choices") or []
    if not choices:
        raise ValueError("百炼返回为空。")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        chunks = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") in {"text", "output_text"} and item.get("text"):
                    chunks.append(item["text"])
            elif isinstance(item, str):
                chunks.append(item)
        content = "\n".join(chunks)
    return extract_json_object(str(content or ""))


def call_ai_json(system_prompt: str, user_prompt: str, schema_name: str, schema: Dict) -> Dict:
    provider = current_ai_provider()
    if provider == "dashscope":
        return call_dashscope_json(system_prompt, user_prompt, schema_name, schema)
    if provider == "openai":
        return call_openai_json(system_prompt, user_prompt, schema_name, schema)
    raise ValueError("未配置可用的 AI API Key。")


def ai_parse_and_organize_manual(
    raw_text: str,
    existing_categories: List[str],
    custom_instruction: str = "",
) -> Dict[str, object]:
    if not current_ai_key():
        parsed = heuristically_parse_manual_input(raw_text)
        organized = fallback_organize(
            parsed["source_title"] or "",
            parsed["source_body"] or "",
            existing_categories,
        )
        parsed.update(organized)
        return parsed

    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "source_title": {"type": "string"},
            "source_body": {"type": "string"},
            "published_at": {"type": ["string", "null"]},
            "organized_title": {"type": "string"},
            "organized_body": {"type": "string"},
            "categories": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
                "maxItems": 3,
            },
        },
        "required": [
            "source_title",
            "source_body",
            "published_at",
            "organized_title",
            "organized_body",
            "categories",
        ],
    }
    system_prompt = (
        "你是一个中文内容整理助手。任务是从用户粘贴的整段内容中识别标题、正文、发布时间，"
        "再输出一个适合知识库保存的整理标题和整理正文。"
        "整理标题要简练、非口语化，让人一眼看懂内容主题。"
        "整理正文要保留原意和细节，只做清晰化整理，不要过度总结，不要输出标签，不要输出行动建议。"
        "重点是删除寒暄、重复、情绪化表达和低信息密度句子，而不是压缩掉关键知识点。"
        "请尽量保留原文中的重要概念、步骤、方法、例子、注意点、结论和适用条件。"
        "输出时不要写成一整段大块文字，应整理成更适合阅读回看的 4 到 8 段；"
        "如果原文包含步骤、要点、概念或并列信息，优先拆成纵向分点，使用 bullet 样式，不要使用一、二、三或 1、2、3 这种编号。"
        "每段保持信息完整，但不要冗长。段落之间直接换行，不要额外空一整行。"
        "分类仅输出一级分类名称，可复用已有分类，也可新建合理的新分类。"
    )
    categories_hint = "、".join(existing_categories) if existing_categories else "暂无既有分类"
    instruction_block = (
        f"\n\n用户本次整理要求：{custom_instruction}\n请优先满足这个要求，但不要编造原文中不存在的信息。"
        if custom_instruction
        else ""
    )
    user_prompt = (
        f"已有分类：{categories_hint}\n\n"
        "请根据下面的原始内容完成识别和整理。\n"
        f"{raw_text}"
        f"{instruction_block}"
    )
    try:
        result = call_ai_json(system_prompt, user_prompt, "manual_organize", schema)
        result["source_title"] = normalize_spaces(result["source_title"])
        result["source_body"] = normalize_multiline(result["source_body"])
        result["organized_title"] = normalize_spaces(result["organized_title"])
        result["organized_body"] = polish_organized_body(result["organized_body"])
        result["source_url"] = ""
        return result
    except Exception:
        parsed = heuristically_parse_manual_input(raw_text)
        organized = fallback_organize(
            parsed["source_title"] or "",
            parsed["source_body"] or "",
            existing_categories,
        )
        parsed.update(organized)
        return parsed


def ai_organize_extracted_content(
    source_title: str,
    source_body: str,
    existing_categories: List[str],
    image_ocr_text: str = "",
    custom_instruction: str = "",
) -> Dict[str, object]:
    merged_body = merge_extracted_and_ocr_text(source_body, image_ocr_text)
    if not current_ai_key():
        return fallback_organize(source_title, merged_body, existing_categories)

    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "organized_title": {"type": "string"},
            "organized_body": {"type": "string"},
            "categories": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
                "maxItems": 3,
            },
        },
        "required": ["organized_title", "organized_body", "categories"],
    }
    system_prompt = (
        "你是一个中文知识卡片整理助手。请将输入内容整理成适合长期个人知识库保存的结构。"
        "整理标题要简练、非口语化、能一句话说明内容主题。"
        "整理正文要保留原意和重要细节，不要过度压缩，不要输出标签和行动建议。"
        "你的重点是剔除广告感、口语化感叹、重复铺垫和低价值句子，而不是删掉知识本体。"
        "请尽量保留原文中的关键概念、步骤、方法、例子、注意事项、结论和适用场景。"
        "如果输入里包含“图片文字”，说明这些文字来自配图 OCR，请和正文一起理解，去重后再整理。"
        "不要把结果写成一整段，应整理成更清晰、可快速浏览的 4 到 8 段；"
        "如果内容里有方法、步骤、概念、注意点或清单，优先拆成纵向分点，使用 bullet 样式，不要使用一、二、三或 1、2、3 这种编号。"
        "整体信息量应明显高于摘要，但仍然保持易读。段落之间直接换行，不要额外空一整行。"
        "分类只输出一级分类名称，可优先复用已有分类。"
    )
    categories_hint = "、".join(existing_categories) if existing_categories else "暂无既有分类"
    instruction_block = (
        f"\n\n用户本次整理要求：{custom_instruction}\n请优先满足这个要求，但不要编造原文中不存在的信息。"
        if custom_instruction
        else ""
    )
    user_prompt = (
        f"已有分类：{categories_hint}\n\n"
        f"原标题：{source_title}\n\n"
        f"原始内容：\n{merged_body}"
        f"{instruction_block}"
    )
    try:
        result = call_ai_json(system_prompt, user_prompt, "link_organize", schema)
        result["organized_title"] = normalize_spaces(result["organized_title"])
        result["organized_body"] = polish_organized_body(result["organized_body"])
        return result
    except Exception:
        return fallback_organize(source_title, merged_body, existing_categories)


def ensure_categories(conn: sqlite3.Connection, categories: Iterable[str]) -> List[int]:
    clean_names = []
    seen = set()
    for name in categories:
        normalized = normalize_spaces(name)
        if normalized and normalized not in seen:
            clean_names.append(normalized)
            seen.add(normalized)
    if not clean_names:
        clean_names = ["待整理"]

    ids = []
    for name in clean_names:
        row = conn.execute("SELECT id FROM categories WHERE name = ?", (name,)).fetchone()
        if not row:
            cursor = conn.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            ids.append(cursor.lastrowid)
        else:
            ids.append(row["id"])
    return ids


def fetch_all_categories(conn: sqlite3.Connection) -> List[Dict[str, object]]:
    rows = conn.execute(
        """
        SELECT c.id, c.name, COUNT(cc.content_id) AS item_count
        FROM categories c
        LEFT JOIN content_categories cc ON cc.category_id = c.id
        GROUP BY c.id
        ORDER BY LOWER(c.name) ASC
        """
    ).fetchall()
    return [dict(row) for row in rows]


def rename_category(category_id: int, new_name: str) -> Dict[str, object]:
    name = normalize_spaces(new_name)
    if not name:
        raise ValueError("分类名称不能为空。")

    with closing(get_conn()) as conn:
        existing = conn.execute("SELECT id FROM categories WHERE id = ?", (category_id,)).fetchone()
        if not existing:
            raise ValueError("未找到要修改的分类。")

        duplicate = conn.execute(
            "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?",
            (name, category_id),
        ).fetchone()
        if duplicate:
            raise ValueError("已存在同名分类。")

        conn.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))
        conn.commit()
        row = conn.execute(
            """
            SELECT c.id, c.name, COUNT(cc.content_id) AS item_count
            FROM categories c
            LEFT JOIN content_categories cc ON cc.category_id = c.id
            WHERE c.id = ?
            GROUP BY c.id
            """,
            (category_id,),
        ).fetchone()
        if not row:
            raise ValueError("分类更新失败。")
        return dict(row)


def delete_category(category_id: int) -> None:
    with closing(get_conn()) as conn:
        existing = conn.execute("SELECT id FROM categories WHERE id = ?", (category_id,)).fetchone()
        if not existing:
            raise ValueError("未找到要删除的分类。")

        affected_rows = conn.execute(
            "SELECT DISTINCT content_id FROM content_categories WHERE category_id = ?",
            (category_id,),
        ).fetchall()
        affected_content_ids = [row["content_id"] for row in affected_rows]

        conn.execute("DELETE FROM content_categories WHERE category_id = ?", (category_id,))
        conn.execute("DELETE FROM categories WHERE id = ?", (category_id,))

        if affected_content_ids:
            fallback_category_ids = ensure_categories(conn, ["待整理"])
            fallback_category_id = fallback_category_ids[0]
            for content_id in affected_content_ids:
                remaining = conn.execute(
                    "SELECT COUNT(*) AS count FROM content_categories WHERE content_id = ?",
                    (content_id,),
                ).fetchone()
                if remaining and remaining["count"] == 0:
                    conn.execute(
                        "INSERT OR IGNORE INTO content_categories (content_id, category_id) VALUES (?, ?)",
                        (content_id, fallback_category_id),
                    )

        conn.commit()


def fetch_content_by_id(conn: sqlite3.Connection, content_id: int) -> Optional[Dict[str, object]]:
    row = conn.execute(
        """
        SELECT
            ct.id,
            ct.title,
            ct.body,
            ct.created_at,
            ct.note,
            ct.source_url,
            ct.updated_at,
            GROUP_CONCAT(c.name, '||') AS category_names
        FROM contents ct
        LEFT JOIN content_categories cc ON cc.content_id = ct.id
        LEFT JOIN categories c ON c.id = cc.category_id
        WHERE ct.id = ?
        GROUP BY ct.id
        """,
        (content_id,),
    ).fetchone()
    if not row:
        return None
    item = dict(row)
    item["categories"] = item.pop("category_names").split("||") if item.get("category_names") else []
    return item


def fetch_all_contents(conn: sqlite3.Connection) -> List[Dict[str, object]]:
    rows = conn.execute(
        """
        SELECT
            ct.id,
            ct.title,
            ct.body,
            ct.created_at,
            ct.note,
            ct.source_url,
            ct.updated_at,
            GROUP_CONCAT(c.name, '||') AS category_names
        FROM contents ct
        LEFT JOIN content_categories cc ON cc.content_id = ct.id
        LEFT JOIN categories c ON c.id = cc.category_id
        GROUP BY ct.id
        ORDER BY datetime(ct.created_at) DESC, ct.id DESC
        """
    ).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        item["categories"] = item.pop("category_names").split("||") if item.get("category_names") else []
        items.append(item)
    return items


def save_content(payload: Dict[str, object], content_id: Optional[int] = None) -> Dict[str, object]:
    title = normalize_spaces(str(payload.get("title", "")))
    body = normalize_multiline(str(payload.get("body", "")))
    note = normalize_multiline(str(payload.get("note", "")))
    source_url = normalize_spaces(str(payload.get("source_url", "")))
    categories = payload.get("categories", [])
    if not title or not body:
        raise ValueError("标题和正文不能为空。")
    if not isinstance(categories, list) or not categories:
        raise ValueError("请至少保留一个分类。")

    with closing(get_conn()) as conn:
        now = now_iso()
        if content_id is None:
            cursor = conn.execute(
                """
                INSERT INTO contents (title, body, created_at, note, source_url, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (title, body, now, note, source_url, now),
            )
            content_id = cursor.lastrowid
        else:
            existing = conn.execute("SELECT id FROM contents WHERE id = ?", (content_id,)).fetchone()
            if not existing:
                raise ValueError("要更新的内容不存在。")
            conn.execute(
                """
                UPDATE contents
                SET title = ?, body = ?, note = ?, source_url = ?, updated_at = ?
                WHERE id = ?
                """,
                (title, body, note, source_url, now, content_id),
            )
            conn.execute("DELETE FROM content_categories WHERE content_id = ?", (content_id,))

        category_ids = ensure_categories(conn, categories)
        conn.executemany(
            "INSERT INTO content_categories (content_id, category_id) VALUES (?, ?)",
            [(content_id, category_id) for category_id in category_ids],
        )
        conn.commit()
        saved = fetch_content_by_id(conn, int(content_id))
        if not saved:
            raise ValueError("保存失败。")
        return saved


def delete_content(content_id: int) -> None:
    with closing(get_conn()) as conn:
        conn.execute("DELETE FROM content_categories WHERE content_id = ?", (content_id,))
        conn.execute("DELETE FROM contents WHERE id = ?", (content_id,))
        conn.commit()


def markdown_for_item(item: Dict[str, object]) -> str:
    categories = "、".join(item.get("categories", [])) or "未分类"
    source_url = item.get("source_url") or "无"
    note = item.get("note") or ""
    sections = [
        f"# {item['title']}",
        "",
        f"- 创建时间：{item['created_at']}",
        f"- 分类：{categories}",
        f"- 原始链接：{source_url}",
        "",
        "## 整理正文",
        "",
        item["body"],
    ]
    if note:
        sections.extend(["", "## 用户备注", "", note])
    return "\n".join(sections).strip() + "\n"


def xml_escape(value: object) -> str:
    return html_escape("" if value is None else str(value), quote=False)


def cell_ref(col_index: int, row_index: int) -> str:
    letters = ""
    index = col_index
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return f"{letters}{row_index}"


def build_xlsx_bytes(rows: List[List[str]]) -> bytes:
    sheet_rows = []
    for row_index, values in enumerate(rows, start=1):
        cells = []
        for col_index, value in enumerate(values, start=1):
            ref = cell_ref(col_index, row_index)
            text = xml_escape(value)
            cells.append(f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>')
        sheet_rows.append(f"<row r=\"{row_index}\">{''.join(cells)}</row>")
    worksheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        "</worksheet>"
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Knowledge" sheetId="1" r:id="rId1"/></sheets></workbook>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        "</Types>"
    )
    root_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" '
        'Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" '
        'Target="docProps/app.xml"/>'
        "</Relationships>"
    )
    workbook_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        'Target="worksheets/sheet1.xml"/>'
        "</Relationships>"
    )
    created = utc_now()
    core_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>收藏知识银河导出</dc:title>'
        '<dc:creator>Codex</dc:creator>'
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{created}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{created}</dcterms:modified>'
        "</cp:coreProperties>"
    )
    app_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>Python</Application>'
        "</Properties>"
    )

    from io import BytesIO

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", root_rels)
        zf.writestr("xl/workbook.xml", workbook_xml)
        zf.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        zf.writestr("xl/worksheets/sheet1.xml", worksheet_xml)
        zf.writestr("docProps/core.xml", core_xml)
        zf.writestr("docProps/app.xml", app_xml)
    return buffer.getvalue()


def export_rows(items: List[Dict[str, object]]) -> List[List[str]]:
    rows = [["整理标题", "整理正文", "创建时间", "所属分类", "用户备注", "原始链接"]]
    for item in items:
        rows.append(
            [
                item["title"],
                item["body"],
                item["created_at"],
                "、".join(item.get("categories", [])),
                item.get("note") or "",
                item.get("source_url") or "",
            ]
        )
    return rows


class AppHandler(BaseHTTPRequestHandler):
    server_version = "AIOrganizer/1.0"

    def reject_read_only(self) -> None:
        self.respond_json(
            {
                "error": READ_ONLY_MESSAGE,
                "code": "READ_ONLY_MODE",
                "read_only": True,
            },
            status=403,
        )

    def ensure_write_access(self) -> bool:
        if not READ_ONLY_MODE:
            return True
        self.reject_read_only()
        return False

    def do_GET(self) -> None:
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/" or parsed.path == "/index.html":
                return self.serve_static("index.html", "text/html; charset=utf-8")
            if parsed.path.startswith("/static/"):
                rel = parsed.path[len("/static/") :]
                return self.serve_static(rel, self.guess_content_type(rel))
            if parsed.path.startswith("/assets/"):
                rel = parsed.path[len("/") :]
                return self.serve_file(BASE_DIR / rel, self.guess_content_type(rel))
            if parsed.path == "/api/bootstrap":
                return self.handle_bootstrap()
            if parsed.path == "/api/export":
                return self.handle_export(parsed.query)
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        except Exception as exc:
            self.respond_json({"error": str(exc)}, status=500)

    def do_POST(self) -> None:
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/api/organize":
                if not self.ensure_write_access():
                    return
                return self.handle_organize()
            if parsed.path == "/api/contents":
                if not self.ensure_write_access():
                    return
                return self.handle_save_content()
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        except ValueError as exc:
            self.respond_json({"error": str(exc)}, status=400)
        except Exception as exc:
            self.respond_json({"error": str(exc)}, status=500)

    def do_PUT(self) -> None:
        try:
            if self.path.startswith("/api/contents/"):
                if not self.ensure_write_access():
                    return
                content_id = int(self.path.rsplit("/", 1)[-1])
                return self.handle_update_content(content_id)
            if self.path.startswith("/api/categories/"):
                if not self.ensure_write_access():
                    return
                category_id = int(self.path.rsplit("/", 1)[-1])
                return self.handle_update_category(category_id)
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        except ValueError as exc:
            self.respond_json({"error": str(exc)}, status=400)
        except Exception as exc:
            self.respond_json({"error": str(exc)}, status=500)

    def do_DELETE(self) -> None:
        try:
            if self.path.startswith("/api/contents/"):
                if not self.ensure_write_access():
                    return
                content_id = int(self.path.rsplit("/", 1)[-1])
                delete_content(content_id)
                return self.respond_json({"ok": True})
            if self.path.startswith("/api/categories/"):
                if not self.ensure_write_access():
                    return
                category_id = int(self.path.rsplit("/", 1)[-1])
                delete_category(category_id)
                with closing(get_conn()) as conn:
                    return self.respond_json(
                        {
                            "categories": fetch_all_categories(conn),
                            "contents": fetch_all_contents(conn),
                        }
                    )
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        except Exception as exc:
            self.respond_json({"error": str(exc)}, status=500)

    def read_json(self) -> Dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw or "{}")

    def respond_json(self, payload: Dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, rel_path: str, content_type: str) -> None:
        target = (STATIC_DIR / rel_path).resolve()
        if STATIC_DIR.resolve() not in target.parents and target != STATIC_DIR.resolve():
            self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
            return
        if not target.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        data = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_file(self, target: Path, content_type: str) -> None:
        resolved = target.resolve()
        if BASE_DIR.resolve() not in resolved.parents and resolved != BASE_DIR.resolve():
            self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
            return
        if not resolved.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        data = resolved.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def guess_content_type(self, rel_path: str) -> str:
        if rel_path.endswith(".css"):
            return "text/css; charset=utf-8"
        if rel_path.endswith(".js"):
            return "application/javascript; charset=utf-8"
        if rel_path.endswith(".svg"):
            return "image/svg+xml"
        if rel_path.endswith(".png"):
            return "image/png"
        if rel_path.endswith(".jpg") or rel_path.endswith(".jpeg"):
            return "image/jpeg"
        if rel_path.endswith(".webp"):
            return "image/webp"
        return "application/octet-stream"

    def handle_bootstrap(self) -> None:
        with closing(get_conn()) as conn:
            payload = {
                "contents": fetch_all_contents(conn),
                "categories": fetch_all_categories(conn),
                "config": {
                    "aiConfigured": bool(current_ai_key()),
                    "aiProvider": current_ai_provider(),
                    "readOnlyMode": READ_ONLY_MODE,
                    "readOnlyMessage": READ_ONLY_MESSAGE,
                },
            }
        self.respond_json(payload)

    def handle_organize(self) -> None:
        payload = self.read_json()
        mode = payload.get("mode")
        raw_input = str(payload.get("input", "")).strip()
        custom_instruction = normalize_spaces(str(payload.get("custom_instruction", "") or ""))
        with closing(get_conn()) as conn:
            existing_categories = [item["name"] for item in fetch_all_categories(conn)]

        if mode == "manual":
            result = ai_parse_and_organize_manual(raw_input, existing_categories, custom_instruction)
            draft = {
                "title": result["organized_title"],
                "body": result["organized_body"],
                "note": "",
                "source_url": "",
                "categories": result["categories"],
            }
            preview = {
                "source_title": result["source_title"],
                "source_body": result["source_body"],
                "published_at": result.get("published_at"),
            }
            return self.respond_json(
                {
                    "draft": draft,
                    "preview": preview,
                    "message": "AI 已完成整理，请确认后入库。",
                }
            )

        if mode == "link":
            try:
                extracted = fetch_link_content(raw_input)
            except ValueError as exc:
                return self.respond_json(
                    {
                        "error": str(exc),
                        "fallback": "你可以切换到手动粘贴模式，直接粘贴标题、正文和发布时间继续整理。",
                    },
                    status=422,
                )

            organized = ai_organize_extracted_content(
                extracted["source_title"] or "",
                extracted["source_body"] or "",
                existing_categories,
                extracted.get("image_ocr_text") or "",
                custom_instruction,
            )
            draft = {
                "title": organized["organized_title"],
                "body": organized["organized_body"],
                "note": "",
                "source_url": extracted["source_url"] or "",
                "categories": organized["categories"],
            }
            preview = {
                "source_title": extracted["source_title"],
                "source_body": extracted["source_body"],
                "image_ocr_text": extracted.get("image_ocr_text", ""),
                "image_count": len(extracted.get("image_urls") or []),
                "ocr_status": extracted.get("ocr_status", ""),
                "published_at": extracted.get("published_at"),
            }
            return self.respond_json(
                {
                    "draft": draft,
                    "preview": preview,
                    "message": (
                        "AI 已为你生成整理结果并推荐分类。"
                        + (
                            f" 图片处理状态：{extracted.get('ocr_status', '')}"
                            if extracted.get("ocr_status")
                            else ""
                        )
                    ),
                }
            )

        raise ValueError("不支持的导入模式。")

    def handle_save_content(self) -> None:
        payload = self.read_json()
        saved = save_content(payload)
        with closing(get_conn()) as conn:
            categories = fetch_all_categories(conn)
        self.respond_json({"content": saved, "categories": categories})

    def handle_update_content(self, content_id: int) -> None:
        payload = self.read_json()
        saved = save_content(payload, content_id=content_id)
        with closing(get_conn()) as conn:
            categories = fetch_all_categories(conn)
        self.respond_json({"content": saved, "categories": categories})

    def handle_update_category(self, category_id: int) -> None:
        payload = self.read_json()
        rename_category(category_id, str(payload.get("name", "")))
        with closing(get_conn()) as conn:
            self.respond_json(
                {
                    "categories": fetch_all_categories(conn),
                    "contents": fetch_all_contents(conn),
                }
            )

    def handle_export(self, raw_query: str) -> None:
        query = urllib.parse.parse_qs(raw_query)
        export_format = query.get("format", ["md"])[0]
        scope = query.get("scope", ["all"])[0]

        with closing(get_conn()) as conn:
            all_items = fetch_all_contents(conn)

        if scope == "all":
            items = all_items
            if not items:
                raise ValueError("当前还没有内容可导出。")
            file_stem = "starvault_all_export"
        elif scope == "single":
            content_id = int(query.get("id", ["0"])[0])
            items = [item for item in all_items if item["id"] == content_id]
            if not items:
                raise ValueError("未找到要导出的内容。")
            file_stem = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", items[0]["title"])[:36] or "single_export"
        elif scope == "category":
            category_name = query.get("name", [""])[0]
            items = [item for item in all_items if category_name in item.get("categories", [])]
            if not items:
                raise ValueError("该分类下暂无内容可导出。")
            file_stem = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", category_name)[:36] or "category_export"
        elif scope == "categories":
            category_names = [item.strip() for item in query.get("name", []) if item.strip()]
            if not category_names:
                raise ValueError("请至少选择一个分类。")
            selected = set(category_names)
            items = [
                item
                for item in all_items
                if selected.intersection(set(item.get("categories", [])))
            ]
            if not items:
                raise ValueError("所选分类下暂无内容可导出。")
            file_stem = "starvault_selected_categories"
        else:
            raise ValueError("不支持的导出范围。")

        if export_format == "md":
            if scope == "single":
                data = markdown_for_item(items[0]).encode("utf-8")
            else:
                combined = []
                for index, item in enumerate(items):
                    if index:
                        combined.append("\n\n---\n\n")
                    combined.append(markdown_for_item(item))
                data = "".join(combined).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header(
                "Content-Disposition",
                f"attachment; filename*=UTF-8''{urllib.parse.quote(file_stem + '.md')}",
            )
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if export_format == "xlsx":
            data = build_xlsx_bytes(export_rows(items))
            self.send_response(HTTPStatus.OK)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.send_header(
                "Content-Disposition",
                f"attachment; filename*=UTF-8''{urllib.parse.quote(file_stem + '.xlsx')}",
            )
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        raise ValueError("暂不支持该导出格式。")

    def log_message(self, format: str, *args) -> None:
        return


def run() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"收藏知识银河运行中: http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    run()
