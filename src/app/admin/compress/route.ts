import sharp from "sharp";

export async function POST(request: Request) {
  let json;
  try {
    json = await request.json();
  } catch (e) {
    console.log(e);
    return new Response("Invalid request body", { status: 400 });
  }

  const { key, url, width, format } = json;
  if (key !== process.env.COMPRESS_API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ct = contentType(format);
  if (!ct) {
    return new Response("Invalid format", { status: 400 });
  }

  const imageResponse = await fetch(url);
  const image = await imageResponse.blob();

  const newBuffer = await sharp(Buffer.from(await image.arrayBuffer()))
    .resize({ width: parseInt(width) })
    .toFormat(format)
    .toBuffer();

  const headers = new Headers();
  headers.set("content-type", ct);
  return new Response(newBuffer, { headers });
}

function contentType(format: string) {
  switch (format) {
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "heif":
      return "image/heif";
    case "jpeg":
      return "image/jpeg";
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
  }

  return null;
}
