/**
 * DeepL翻译实现
 */
const axios = require("axios");
const { random } = require("lodash");

const BASE_URL = "https://www2.deepl.com/jsonrpc";

/**
 * 生成随机请求ID
 * @returns {number}
 */
function getRandomNumber() {
  return random(8300000, 8399998) * 1000;
}

/**
 * 获取文本中'i'的数量
 * @param {string} text
 * @returns {number}
 */
function getICount(translateText) {
  return (translateText || "").split("i").length - 1;
}

/**
 * 生成时间戳
 * @param {number} iCount
 * @returns {number}
 */
function getTimeStamp(iCount) {
  const ts = Date.now();
  if (iCount !== 0) {
    iCount = iCount + 1;
    return ts - (ts % iCount) + iCount;
  }
  return ts;
}

/**
 * 格式化POST字符串
 * @param {Object} postData
 * @returns {string}
 */
function formatPostString(postData) {
  let postStr = JSON.stringify(postData);
  if ((postData.id + 5) % 29 === 0 || (postData.id + 3) % 13 === 0) {
    postStr = postStr.replace('"method":"', '"method" : "');
  } else {
    postStr = postStr.replace('"method":"', '"method": "');
  }
  return postStr;
}

/**
 * 检查是否包含HTML标签
 * @param {string} text
 * @returns {boolean}
 */
function isRichText(text) {
  return text.includes("<") && text.includes(">");
}

/**
 * 发送请求到DeepL
 * @param {Object} postData
 * @param {string} urlMethod
 * @param {string} proxyURL
 * @param {string} dlSession
 */
async function makeRequest(postData, urlMethod, proxyURL = "", dlSession = "") {
  const urlFull = `${BASE_URL}?client=chrome-extension,1.28.0&method=${urlMethod}`;
  const postStr = formatPostString(postData);

  const headers = {
    Accept: "*/*",
    "Accept-Language":
      "en-US,en;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh-HK;q=0.6,zh;q=0.5",
    Authorization: "None",
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    DNT: "1",
    Origin: "chrome-extension://cofdbpoegempjloogbagkncekinflcnj",
    Pragma: "no-cache",
    Priority: "u=1, i",
    Referer: "https://www.deepl.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "none",
    "Sec-GPC": "1",
    "User-Agent":
      "DeepLBrowserExtension/1.28.0 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  };

  if (dlSession) {
    headers["Cookie"] = `dl_session=${dlSession}`;
  }

  const config = {
    method: "post",
    url: urlFull,
    headers: headers,
    data: postStr,
  };

  if (proxyURL) {
    config.proxy = {
      protocol: new URL(proxyURL).protocol.slice(0, -1),
      host: new URL(proxyURL).hostname,
      port: new URL(proxyURL).port,
    };
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * 分割文本
 * @param {string} text
 * @param {boolean} tagHandling
 * @param {string} proxyURL
 * @param {string} dlSession
 */
async function splitText(text, tagHandling, proxyURL = "", dlSession = "") {
  const postData = {
    jsonrpc: "2.0",
    method: "LMT_split_text",
    id: getRandomNumber(),
    params: {
      commonJobParams: {
        mode: "translate",
      },
      lang: {
        lang_user_selected: "AUTO",
      },
      texts: [text],
      textType: tagHandling || isRichText(text) ? "richtext" : "plaintext",
    },
  };

  return makeRequest(postData, "LMT_split_text", proxyURL, dlSession);
}

/**
 * DeepL翻译主函数
 * @param {string} sourceLang
 * @param {string} targetLang
 * @param {string} text
 * @param {string} tagHandling
 * @param {string} proxyURL
 * @param {string} dlSession
 */
async function translate(
  sourceLang = "AUTO",
  targetLang = "ZH",
  text,
  tagHandling = "",
  proxyURL = "",
  dlSession = ""
) {
  if (!text) {
    return {
      code: 404,
      message: "No text to translate",
    };
  }

  try {
    // 先分割文本
    const splitResult = await splitText(
      text,
      tagHandling === "html" || tagHandling === "xml",
      proxyURL,
      dlSession
    );

    // 处理源语言
    if (sourceLang === "auto" || !sourceLang) {
      sourceLang = splitResult.result.lang.detected.toLowerCase();
    }

    // 准备翻译任务
    const jobs = [];
    const chunks = splitResult.result.texts[0].chunks;

    chunks.forEach((chunk, idx) => {
      const contextBefore = idx > 0 ? [chunks[idx - 1].sentences[0].text] : [];
      const contextAfter =
        idx < chunks.length - 1 ? [chunks[idx + 1].sentences[0].text] : [];

      jobs.push({
        kind: "default",
        preferred_num_beams: 4,
        raw_en_context_before: contextBefore,
        raw_en_context_after: contextAfter,
        sentences: [
          {
            prefix: chunk.sentences[0].prefix,
            text: chunk.sentences[0].text,
            id: idx + 1,
          },
        ],
      });
    });

    // 处理目标语言
    let targetLangCode = targetLang;
    let hasRegionalVariant = false;
    if (targetLang.includes("-")) {
      const parts = targetLang.split("-");
      targetLangCode = parts[0];
      hasRegionalVariant = true;
    }

    // 准备翻译请求
    const id = getRandomNumber();
    const postData = {
      jsonrpc: "2.0",
      method: "LMT_handle_jobs",
      id: id,
      params: {
        commonJobParams: {
          mode: "translate",
          ...(hasRegionalVariant && { regionalVariant: targetLang }),
        },
        lang: {
          source_lang_computed: sourceLang.toUpperCase(),
          target_lang: targetLangCode.toUpperCase(),
        },
        jobs: jobs,
        priority: 1,
        timestamp: getTimeStamp(getICount(text)),
      },
    };

    const result = await makeRequest(
      postData,
      "LMT_handle_jobs",
      proxyURL,
      dlSession
    );

    // 处理翻译结果
    if (result.result && result.result.translations) {
      const translations = result.result.translations;
      let alternatives = [];
      let translatedText = "";

      if (translations.length > 0) {
        // 获取替代翻译
        const numBeams = translations[0].beams.length;
        for (let i = 0; i < numBeams; i++) {
          let altText = "";
          translations.forEach((translation) => {
            if (translation.beams[i]) {
              altText += translation.beams[i].sentences[0].text;
            }
          });
          if (altText) {
            alternatives.push(altText);
          }
        }

        // 获取主要翻译
        translatedText = translations
          .map((translation) => translation.beams[0].sentences[0].text)
          .join(" ")
          .trim();
      }

      if (!translatedText) {
        return {
          code: 503,
          message: "Translation failed",
        };
      }

      return {
        code: 200,
        id: id,
        data: translatedText,
        alternatives: alternatives,
        source_lang: sourceLang,
        target_lang: targetLang,
        method: dlSession ? "Pro" : "Free",
      };
    }

    return {
      code: 503,
      message: "Translation failed",
    };
  } catch (error) {
    return {
      code: 503,
      message: error.message,
    };
  }
}

module.exports = { translate };
