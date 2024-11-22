const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { translate } = require("./translate");

const app = express();
const PORT = process.env.PORT || 1188;
const HOST = process.env.HOST || "0.0.0.0";
const TOKEN = process.env.TOKEN || "";

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 认证中间件
const authMiddleware = (req, res, next) => {
  if (TOKEN) {
    const tokenInQuery = req.query.token;
    const authHeader = req.headers.authorization;
    let tokenInHeader = "";

    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2) {
        if (parts[0] === "Bearer" || parts[0] === "DeepL-Auth-Key") {
          tokenInHeader = parts[1];
        }
      }
    }

    if (tokenInHeader !== TOKEN && tokenInQuery !== TOKEN) {
      return res.status(401).json({
        code: 401,
        message: "Invalid access token",
      });
    }
  }
  next();
};

// 免费API端点
app.post("/translate", authMiddleware, async (req, res) => {
  const {
    text: transText,
    source_lang: sourceLang,
    target_lang: targetLang,
    tag_handling: tagHandling,
  } = req.body;

  if (tagHandling && tagHandling !== "html" && tagHandling !== "xml") {
    return res.status(400).json({
      code: 400,
      message:
        "Invalid tag_handling value. Allowed values are 'html' and 'xml'.",
    });
  }

  try {
    const result = await translate(
      sourceLang,
      targetLang,
      transText,
      tagHandling
    );

    if (result.code === 200) {
      res.json({
        code: 200,
        id: result.id,
        data: result.data,
        alternatives: result.alternatives || [],
        source_lang: result.source_lang.toUpperCase(),
        target_lang: result.target_lang.toUpperCase(),
        method: result.method || "Free",
      });
    } else {
      res.status(result.code).json({
        code: result.code,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(503).json({
      code: 503,
      message: error.message,
    });
  }
});

// Pro API端点
app.post("/v1/translate", authMiddleware, async (req, res) => {
  const {
    text: transText,
    source_lang: sourceLang,
    target_lang: targetLang,
    tag_handling: tagHandling,
  } = req.body;
  const dlSession = req.headers.cookie?.replace("dl_session=", "") || "";

  if (tagHandling && tagHandling !== "html" && tagHandling !== "xml") {
    return res.status(400).json({
      code: 400,
      message:
        "Invalid tag_handling value. Allowed values are 'html' and 'xml'.",
    });
  }

  if (!dlSession) {
    return res.status(401).json({
      code: 401,
      message: "No dl_session Found",
    });
  }

  if (dlSession.includes(".")) {
    return res.status(401).json({
      code: 401,
      message:
        "Your account is not a Pro account. Please upgrade your account or switch to a different account.",
    });
  }

  try {
    const result = await translate(
      sourceLang,
      targetLang,
      transText,
      tagHandling,
      "",
      dlSession
    );

    if (result.code === 200) {
      res.json({
        code: result.code,
        id: result.id,
        data: result.data,
        alternatives: result.alternatives,
        source_lang: result.source_lang,
        target_lang: result.target_lang,
        method: result.method,
      });
    } else {
      res.status(result.code).json({
        code: result.code,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(503).json({
      code: 503,
      message: error.message,
    });
  }
});

// v2 API端点（官方API格式）
app.post("/v2/translate", authMiddleware, async (req, res) => {
  let translateText = "";
  let targetLang = "";

  // 处理表单数据或JSON数据
  if (req.is("application/x-www-form-urlencoded")) {
    translateText = req.body.text;
    targetLang = req.body.target_lang;
  } else {
    const jsonData = req.body;
    translateText = Array.isArray(jsonData.text)
      ? jsonData.text.join("\n")
      : jsonData.text;
    targetLang = jsonData.target_lang;
  }

  if (!translateText || !targetLang) {
    return res.status(400).json({
      code: 400,
      message: "Invalid request payload",
    });
  }

  try {
    const result = await translate("", targetLang, translateText);

    if (result.code === 200) {
      // 使用官方API格式
      res.json({
        translations: [
          {
            detected_source_language: result.source_lang.toUpperCase(),
            text: result.data,
          },
        ],
      });
    } else {
      res.status(result.code).json({
        code: result.code,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(503).json({
      code: 503,
      message: error.message,
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: "Path not found",
  });
});

// 启动服务器
app.listen(PORT, HOST, () => {
  console.log(
    `DeepL X has been successfully launched! Listening on ${HOST}:${PORT}`
  );
  console.log("Developed by sjlleo <i@leo.moe> and missuo <me@missuo.me>.");

  if (TOKEN) {
    console.log("Access token is set.");
  }
});
