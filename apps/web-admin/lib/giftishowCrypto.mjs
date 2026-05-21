/**
 * 기프티쇼 비즈 — custom_auth_token 생성 (AES256/ECB/PKCS5Padding → Base64)
 * @see 연동 규격서 보안 섹션
 */
import crypto from "crypto";

/** @returns {Buffer[]} */
function aesKeyCandidates(encryptionKey) {
  const raw = encryptionKey.trim();
  const out = [];
  const push = (buf) => {
    if (!buf || buf.length === 0) return;
    if (buf.length === 32) out.push(buf);
    else if (buf.length > 32) out.push(buf.subarray(0, 32));
    else {
      const k = Buffer.alloc(32, 0);
      buf.copy(k, 0, 0, buf.length);
      out.push(k);
    }
  };

  push(crypto.createHash("sha256").update(raw, "utf8").digest());
  try {
    push(Buffer.from(raw, "base64"));
  } catch {
    /* ignore */
  }
  push(Buffer.from(raw, "utf8"));
  return [...new Map(out.map((b) => [b.toString("hex"), b])).values()];
}

/**
 * 인증 Key → custom_auth_token (AES-256-ECB, PKCS7 padding, Base64)
 * @param {string} authKey
 * @param {string} encryptionKey 담당자 전달 암호화 키 (Token Key)
 */
export function encryptGiftishowAuthToken(authKey, encryptionKey) {
  const plain = Buffer.from(authKey, "utf8");
  const results = [];
  for (const key of aesKeyCandidates(encryptionKey)) {
    try {
      const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
      const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
      results.push(enc.toString("base64"));
    } catch {
      /* try next key derivation */
    }
  }
  return results;
}

/**
 * @param {object} opts
 * @param {string} opts.authKey custom_auth_code
 * @param {string} opts.encryptionKey 암호화 키 (Token Key)
 * @param {string} [opts.authToken] 이미 발급된 custom_auth_token (있으면 우선)
 * @param {string} opts.apiCode 예) 0001
 * @param {"Y"|"N"} opts.devFlag
 */
export function buildGiftishowHeaders(opts) {
  const { authKey, encryptionKey, authToken, apiCode, devFlag } = opts;
  const tokens = authToken
    ? [authToken]
    : encryptGiftishowAuthToken(authKey, encryptionKey);

  return tokens.map((custom_auth_token) => ({
    custom_auth_code: authKey,
    custom_auth_token,
    api_code: apiCode,
    dev_flag: devFlag,
    Accept: "application/json",
  }));
}
