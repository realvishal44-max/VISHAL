// ============================================================
// ATTENDANCE SECURITY SERVICE MODULE (VANILLA JS / WEB CRYPTO)
// ============================================================

(function() {
  const SECRET_SEED = "BCA_STORE_ATTENDANCE_SECRET_SECURE_TOKEN_2026";
  const CSRF_STORAGE_KEY = "attendance_csrf_token";
  const RATE_LIMIT_MS = 3000; // 3 seconds between submits
  let lastSubmitTime = 0;

  // Helper: Base64URL encoding/decoding for UTF-8 strings (JSON metadata)
  function base64UrlEncode(str) {
    let base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) { base64 += '='; }
    return decodeURIComponent(escape(atob(base64)));
  }

  // Helper: Binary buffer encoding/decoding for raw cryptographic signature bytes
  function bufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function base64UrlToBuffer(base64Url) {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) { base64 += '='; }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Web Crypto Helpers
  async function getCryptoKey() {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET_SEED),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign", "verify"]
    );
  }

  async function getEncryptionKey() {
    const enc = new TextEncoder();
    // Hash the seed to get a 256-bit key for AES
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(SECRET_SEED));
    return window.crypto.subtle.importKey(
      "raw",
      hashBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  window.AttendanceSecurity = {
    // --------------------------------------------------------
    // 1. JWT GENERATION AND VALIDATION (Simulated JWT Server)
    // --------------------------------------------------------
    async generateJWT(payload) {
      const header = { alg: "HS256", typ: "JWT" };
      const headerStr = base64UrlEncode(JSON.stringify(header));
      
      // Add standard claims (iat, exp)
      const claimPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: payload.exp || Math.floor((Date.now() + 3600000) / 1000) // 1 hr default
      };
      const payloadStr = base64UrlEncode(JSON.stringify(claimPayload));
      
      const key = await getCryptoKey();
      const enc = new TextEncoder();
      const signatureBuffer = await window.crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(`${headerStr}.${payloadStr}`)
      );
      
      const signatureStr = bufferToBase64Url(signatureBuffer);
      return `${headerStr}.${payloadStr}.${signatureStr}`;
    },

    async verifyJWT(token) {
      if (!token) return { valid: false, reason: "No token provided" };
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, reason: "Malformed token" };

      const [headerStr, payloadStr, signatureStr] = parts;
      try {
        const key = await getCryptoKey();
        const enc = new TextEncoder();
        const data = enc.encode(`${headerStr}.${payloadStr}`);
        
        const sigArr = base64UrlToBuffer(signatureStr);

        const validSig = await window.crypto.subtle.verify("HMAC", key, sigArr, data);
        if (!validSig) return { valid: false, reason: "Invalid signature" };

        const payload = JSON.parse(base64UrlDecode(payloadStr));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, reason: "Token expired" };
        }

        return { valid: true, payload };
      } catch (err) {
        return { valid: false, reason: "Verification error: " + err.message };
      }
    },

    // --------------------------------------------------------
    // 2. DATA ENCRYPTION & DECRYPTION (AES-GCM)
    // --------------------------------------------------------
    async encryptData(plainText) {
      if (!plainText) return "";
      try {
        const key = await getEncryptionKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const cipherBuffer = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          key,
          enc.encode(plainText)
        );

        const cipherArray = new Uint8Array(cipherBuffer);
        const result = {
          iv: base64UrlEncode(String.fromCharCode.apply(null, iv)),
          data: base64UrlEncode(String.fromCharCode.apply(null, cipherArray))
        };
        return JSON.stringify(result);
      } catch (e) {
        console.error("Encryption failed:", e);
        return plainText; // Fallback
      }
    },

    async decryptData(cipherTextJSON) {
      if (!cipherTextJSON) return "";
      try {
        const { iv, data } = JSON.parse(cipherTextJSON);
        const key = await getEncryptionKey();

        const ivBin = atob(iv.replace(/-/g, '+').replace(/_/g, '/'));
        const ivArr = new Uint8Array(ivBin.length);
        for (let i = 0; i < ivBin.length; i++) { ivArr[i] = ivBin.charCodeAt(i); }

        const dataBin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
        const dataArr = new Uint8Array(dataBin.length);
        for (let i = 0; i < dataBin.length; i++) { dataArr[i] = dataBin.charCodeAt(i); }

        const plainBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivArr },
          key,
          dataArr
        );

        return new TextDecoder().decode(plainBuffer);
      } catch (e) {
        // Return original if decryption fails (e.g. if it wasn't encrypted)
        return cipherTextJSON;
      }
    },

    // --------------------------------------------------------
    // 3. ANTI-CSRF SECURITY TOKENS
    // --------------------------------------------------------
    generateCSRFToken() {
      const array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      let token = "";
      for (let i = 0; i < array.length; i++) {
        token += array[i].toString(16);
      }
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
      return token;
    },

    verifyCSRFToken(token) {
      const savedToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
      return savedToken && savedToken === token;
    },

    // --------------------------------------------------------
    // 4. RATE LIMITING (THROTTLING)
    // --------------------------------------------------------
    checkRateLimit() {
      const now = Date.now();
      if (now - lastSubmitTime < RATE_LIMIT_MS) {
        return false;
      }
      lastSubmitTime = now;
      return true;
    },

    // --------------------------------------------------------
    // 5. INPUT SANITIZATION (ANTI-XSS / SQL INJECTION GUARD)
    // --------------------------------------------------------
    sanitizeInput(str) {
      if (typeof str !== 'string') return str;
      // Remove script tags, HTML tags, and escape common characters
      let cleaned = str.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
      cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");
      cleaned = cleaned.trim();
      return cleaned;
    },

    validateRollNumber(roll) {
      // Roll numbers should be standard alphanumeric formats: e.g., 21, BCA-21, 2024-21
      return /^[A-Z0-9\-\/]{1,15}$/i.test(roll);
    },

    validateCoordinates(lat, lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      return !isNaN(latitude) && latitude >= -90 && latitude <= 90 &&
             !isNaN(longitude) && longitude >= -180 && longitude <= 180;
    }
  };
})();
