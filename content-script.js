// node_modules/openai/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

// node_modules/openai/internal/utils/uuid.mjs
var uuid4 = function() {
  const { crypto: crypto2 } = globalThis;
  if (crypto2?.randomUUID) {
    uuid4 = crypto2.randomUUID.bind(crypto2);
    return crypto2.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
};

// node_modules/openai/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && (("name" in err) && err.name === "AbortError" || ("message" in err) && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error.stack = err.stack;
        if (err.cause && !error.cause)
          error.cause = err.cause;
        if (err.name)
          error.name = err.name;
        return error;
      }
    } catch {}
    try {
      return new Error(JSON.stringify(err));
    } catch {}
  }
  return new Error(err);
};

// node_modules/openai/core/error.mjs
class OpenAIError extends Error {
}

class APIError extends OpenAIError {
  constructor(status, error, message, headers) {
    super(`${APIError.makeMessage(status, error, message)}`);
    this.status = status;
    this.headers = headers;
    this.requestID = headers?.get("x-request-id");
    this.error = error;
    const data = error;
    this.code = data?.["code"];
    this.param = data?.["param"];
    this.type = data?.["type"];
  }
  static makeMessage(status, error, message) {
    const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
    if (status && msg) {
      return `${status} ${msg}`;
    }
    if (status) {
      return `${status} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status, errorResponse, message, headers) {
    if (!status || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) });
    }
    const error = errorResponse?.["error"];
    if (status === 400) {
      return new BadRequestError(status, error, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, error, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, error, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, error, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error, message, headers);
    }
    if (status === 429) {
      return new RateLimitError(status, error, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, error, message, headers);
    }
    return new APIError(status, error, message, headers);
  }
}

class APIUserAbortError extends APIError {
  constructor({ message } = {}) {
    super(undefined, undefined, message || "Request was aborted.", undefined);
  }
}

class APIConnectionError extends APIError {
  constructor({ message, cause }) {
    super(undefined, undefined, message || "Connection error.", undefined);
    if (cause)
      this.cause = cause;
  }
}

class APIConnectionTimeoutError extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
}

class BadRequestError extends APIError {
}

class AuthenticationError extends APIError {
}

class PermissionDeniedError extends APIError {
}

class NotFoundError extends APIError {
}

class ConflictError extends APIError {
}

class UnprocessableEntityError extends APIError {
}

class RateLimitError extends APIError {
}

class InternalServerError extends APIError {
}

class LengthFinishReasonError extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the length limit was reached`);
  }
}

class ContentFilterFinishReasonError extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the request was rejected by the content filter`);
  }
}

class InvalidWebhookSignatureError extends Error {
  constructor(message) {
    super(message);
  }
}

// node_modules/openai/internal/utils/values.mjs
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var isArray = (val) => (isArray = Array.isArray, isArray(val));
var isReadonlyArray = isArray;
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function isObj(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}
var validatePositiveInteger = (name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new OpenAIError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new OpenAIError(`${name} must be a positive integer`);
  }
  return n;
};
var safeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return;
  }
};

// node_modules/openai/internal/utils/sleep.mjs
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// node_modules/openai/version.mjs
var VERSION = "5.12.1";

// node_modules/openai/internal/detect-platform.mjs
var isRunningInBrowser = () => {
  return typeof window !== "undefined" && typeof window.document !== "undefined" && typeof navigator !== "undefined";
};
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
var getPlatformProperties = () => {
  const detectedPlatform = getDetectedPlatform();
  if (detectedPlatform === "deno") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version
    };
  }
  if (detectedPlatform === "node") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var normalizeArch = (arch) => {
  if (arch === "x32")
    return "x32";
  if (arch === "x86_64" || arch === "x64")
    return "x64";
  if (arch === "arm")
    return "arm";
  if (arch === "aarch64" || arch === "arm64")
    return "arm64";
  if (arch)
    return `other:${arch}`;
  return "unknown";
};
var normalizePlatform = (platform) => {
  platform = platform.toLowerCase();
  if (platform.includes("ios"))
    return "iOS";
  if (platform === "android")
    return "Android";
  if (platform === "darwin")
    return "MacOS";
  if (platform === "win32")
    return "Windows";
  if (platform === "freebsd")
    return "FreeBSD";
  if (platform === "openbsd")
    return "OpenBSD";
  if (platform === "linux")
    return "Linux";
  if (platform)
    return `Other:${platform}`;
  return "Unknown";
};
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};

// node_modules/openai/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream = globalThis.ReadableStream;
  if (typeof ReadableStream === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {},
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}

// node_modules/openai/internal/request-options.mjs
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// node_modules/openai/internal/qs/formats.mjs
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/openai/internal/qs/utils.mjs
var has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
var hex_table = /* @__PURE__ */ (() => {
  const array = [];
  for (let i = 0;i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }
  return array;
})();
var limit = 1024;
var encode = (str, _defaultEncoder, charset, _kind, format) => {
  if (str.length === 0) {
    return str;
  }
  let string = str;
  if (typeof str === "symbol") {
    string = Symbol.prototype.toString.call(str);
  } else if (typeof str !== "string") {
    string = String(str);
  }
  if (charset === "iso-8859-1") {
    return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
      return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
    });
  }
  let out = "";
  for (let j = 0;j < string.length; j += limit) {
    const segment = string.length >= limit ? string.slice(j, j + limit) : string;
    const arr = [];
    for (let i = 0;i < segment.length; ++i) {
      let c = segment.charCodeAt(i);
      if (c === 45 || c === 46 || c === 95 || c === 126 || c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || format === RFC1738 && (c === 40 || c === 41)) {
        arr[arr.length] = segment.charAt(i);
        continue;
      }
      if (c < 128) {
        arr[arr.length] = hex_table[c];
        continue;
      }
      if (c < 2048) {
        arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
        continue;
      }
      if (c < 55296 || c >= 57344) {
        arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        continue;
      }
      i += 1;
      c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
      arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
    }
    out += arr.join("");
  }
  return out;
};
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0;i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}

// node_modules/openai/internal/qs/stringify.mjs
var array_prefix_generators = {
  brackets(prefix) {
    return String(prefix) + "[]";
  },
  comma: "comma",
  indices(prefix, key) {
    return String(prefix) + "[" + key + "]";
  },
  repeat(prefix) {
    return String(prefix);
  }
};
var push_to_array = function(arr, value_or_array) {
  Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
};
var toISOString;
var defaults = {
  addQueryPrefix: false,
  allowDots: false,
  allowEmptyArrays: false,
  arrayFormat: "indices",
  charset: "utf-8",
  charsetSentinel: false,
  delimiter: "&",
  encode: true,
  encodeDotInKeys: false,
  encoder: encode,
  encodeValuesOnly: false,
  format: default_format,
  formatter: default_formatter,
  indices: false,
  serializeDate(date) {
    return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
var sentinel = {};
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== undefined && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, "key", format) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder) {
      const key_value = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + formatter?.(encoder(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder) {
      obj = maybe_map(obj, encoder);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : undefined }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0;j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key];
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = new WeakMap;
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(value, key_prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, valueSideChannel));
  }
  return values;
}
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = new WeakMap;
  for (let i = 0;i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(obj[key], key, generateArrayPrefix, commaRoundTrip, options.allowEmptyArrays, options.strictNullHandling, options.skipNulls, options.encodeDotInKeys, options.encode ? options.encoder : null, options.filter, options.sort, options.allowDots, options.serializeDate, options.format, options.formatter, options.encodeValuesOnly, options.charset, sideChannel));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
// node_modules/openai/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
var encodeUTF8_;
function encodeUTF8(str) {
  let encoder;
  return (encodeUTF8_ ?? (encoder = new globalThis.TextEncoder, encodeUTF8_ = encoder.encode.bind(encoder)))(str);
}
var decodeUTF8_;
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder, decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}

// node_modules/openai/internal/decoders/line.mjs
var _LineDecoder_buffer;
var _LineDecoder_carriageReturnIndex;

class LineDecoder {
  constructor() {
    _LineDecoder_buffer.set(this, undefined);
    _LineDecoder_carriageReturnIndex.set(this, undefined);
    __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array, "f");
    __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
  }
  decode(chunk) {
    if (chunk == null) {
      return [];
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
    const lines = [];
    let patternIndex;
    while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
      if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
        continue;
      }
      if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
        lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
        __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        continue;
      }
      const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
      const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
      lines.push(line);
      __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
      __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
    }
    return lines;
  }
  flush() {
    if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
      return [];
    }
    return this.decode(`
`);
  }
}
_LineDecoder_buffer = new WeakMap, _LineDecoder_carriageReturnIndex = new WeakMap;
LineDecoder.NEWLINE_CHARS = new Set([`
`, "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0;i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0;i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}

// node_modules/openai/internal/utils/log.mjs
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return;
};
function noop() {}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap;
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
var formatRequestDetails = (details) => {
  if (details.options) {
    details.options = { ...details.options };
    delete details.options["headers"];
  }
  if (details.headers) {
    details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
      name,
      name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
    ]));
  }
  if ("retryOfRequestLogID" in details) {
    if (details.retryOfRequestLogID) {
      details.retryOf = details.retryOfRequestLogID;
    }
    delete details.retryOfRequestLogID;
  }
  return details;
};

// node_modules/openai/core/streaming.mjs
var _Stream_client;

class Stream {
  constructor(iterator, controller, client) {
    this.iterator = iterator;
    _Stream_client.set(this, undefined);
    this.controller = controller;
    __classPrivateFieldSet(this, _Stream_client, client, "f");
  }
  static fromSSEResponse(response, controller, client) {
    let consumed = false;
    const logger = client ? loggerFor(client) : console;
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done)
            continue;
          if (sse.data.startsWith("[DONE]")) {
            done = true;
            continue;
          }
          if (sse.event === null || !sse.event.startsWith("thread.")) {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              logger.error(`Could not parse message into JSON:`, sse.data);
              logger.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (data && data.error) {
              throw new APIError(undefined, data.error, undefined, response.headers);
            }
            yield data;
          } else {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`Could not parse message into JSON:`, sse.data);
              console.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (sse.event == "error") {
              throw new APIError(undefined, data.error, data.message, undefined);
            }
            yield { event: sse.event, data };
          }
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new Stream(iterator, controller, client);
  }
  static fromReadableStream(readableStream, controller, client) {
    let consumed = false;
    async function* iterLines() {
      const lineDecoder = new LineDecoder;
      const iter = ReadableStreamToAsyncIterable(readableStream);
      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }
      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const line of iterLines()) {
          if (done)
            continue;
          if (line)
            yield JSON.parse(line);
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new Stream(iterator, controller, client);
  }
  [(_Stream_client = new WeakMap, Symbol.asyncIterator)]() {
    return this.iterator();
  }
  tee() {
    const left = [];
    const right = [];
    const iterator = this.iterator();
    const teeIterator = (queue) => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift();
        }
      };
    };
    return [
      new Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
      new Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
    ];
  }
  toReadableStream() {
    const self = this;
    let iter;
    return makeReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done)
            return ctrl.close();
          const bytes = encodeUTF8(JSON.stringify(value) + `
`);
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      }
    });
  }
}
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new OpenAIError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new OpenAIError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder;
  const lineDecoder = new LineDecoder;
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array;
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}

class SSEDecoder {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }
  decode(line) {
    if (line.endsWith("\r")) {
      line = line.substring(0, line.length - 1);
    }
    if (!line) {
      if (!this.event && !this.data.length)
        return null;
      const sse = {
        event: this.event,
        data: this.data.join(`
`),
        raw: this.chunks
      };
      this.event = null;
      this.data = [];
      this.chunks = [];
      return sse;
    }
    this.chunks.push(line);
    if (line.startsWith(":")) {
      return null;
    }
    let [fieldname, _, value] = partition(line, ":");
    if (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (fieldname === "event") {
      this.event = value;
    } else if (fieldname === "data") {
      this.data.push(value);
    }
    return null;
  }
}
function partition(str, delimiter) {
  const index = str.indexOf(delimiter);
  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }
  return [str, "", ""];
}

// node_modules/openai/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller, client);
      }
      return Stream.fromSSEResponse(response, props.controller, client);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const json = await response.json();
      return addRequestID(json, response);
    }
    const text = await response.text();
    return text;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addRequestID(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperty(value, "_request_id", {
    value: response.headers.get("x-request-id"),
    enumerable: false
  });
}

// node_modules/openai/core/api-promise.mjs
var _APIPromise_client;

class APIPromise extends Promise {
  constructor(client, responsePromise, parseResponse = defaultParseResponse) {
    super((resolve) => {
      resolve(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse;
    _APIPromise_client.set(this, undefined);
    __classPrivateFieldSet(this, _APIPromise_client, client, "f");
  }
  _thenUnwrap(transform) {
    return new APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addRequestID(transform(await this.parseResponse(client, props), props), props.response));
  }
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response, request_id: response.headers.get("x-request-id") };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
}
_APIPromise_client = new WeakMap;

// node_modules/openai/core/pagination.mjs
var _AbstractPage_client;

class AbstractPage {
  constructor(client, response, body, options) {
    _AbstractPage_client.set(this, undefined);
    __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageRequestOptions() != null;
  }
  async getNextPage() {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new OpenAIError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async* iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async* [(_AbstractPage_client = new WeakMap, Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
}

class PagePromise extends APIPromise {
  constructor(client, request, Page) {
    super(client, request, async (client2, props) => new Page(client2, props.response, await defaultParseResponse(client2, props), props.options));
  }
  async* [Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
}

class Page extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.object = body.object;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageRequestOptions() {
    return null;
  }
}

class CursorPage extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    const data = this.getPaginatedItems();
    const id = data[data.length - 1]?.id;
    if (!id) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after: id
      }
    };
  }
}

// node_modules/openai/internal/uploads.mjs
var checkFileSupport = () => {
  if (typeof File === "undefined") {
    const { process: process2 } = globalThis;
    const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
};
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value) {
  return (typeof value === "object" && value !== null && (("name" in value) && value.name && String(value.name) || ("url" in value) && value.url && String(value.url) || ("filename" in value) && value.filename && String(value.filename) || ("path" in value) && value.path && String(value.path)) || "").split(/[\\/]/).pop() || undefined;
}
var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
var multipartFormRequestOptions = async (opts, fetch2) => {
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var supportsFormDataMap = /* @__PURE__ */ new WeakMap;
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData;
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var createForm = async (body, fetch2) => {
  if (!await supportsFormData(fetch2)) {
    throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
  }
  const form = new FormData;
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
  return form;
};
var isNamedBlob = (value) => value instanceof Blob && ("name" in value);
var addFormValue = async (form, key, value) => {
  if (value === undefined)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (value instanceof Response) {
    form.append(key, makeFile([await value.blob()], getName(value)));
  } else if (isAsyncIterable(value)) {
    form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value)));
  } else if (isNamedBlob(value)) {
    form.append(key, value, getName(value));
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};

// node_modules/openai/internal/to-file.mjs
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name || (name = getName(value));
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && ("type" in part) && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
// node_modules/openai/core/resource.mjs
class APIResource {
  constructor(client) {
    this._client = client;
  }
}

// node_modules/openai/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = (pathEncoder = encodeURIPath) => function path(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path = statics.reduce((previousValue, currentValue, index) => {
    if (/[?#]/.test(currentValue)) {
      postPath = true;
    }
    const value = params[index];
    let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
    if (index !== params.length && (value == null || typeof value === "object" && value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
      encoded = value + "";
      invalidSegments.push({
        start: previousValue.length + currentValue.length,
        length: encoded.length,
        error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
      });
    }
    return previousValue + currentValue + (index === params.length ? "" : encoded);
  }, "");
  const pathOnly = path.split(/[?#]/, 1)[0];
  const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
  let match;
  while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
    invalidSegments.push({
      start: match.index,
      length: match[0].length,
      error: `Value "${match[0]}" can't be safely passed as a path parameter`
    });
  }
  invalidSegments.sort((a, b) => a.start - b.start);
  if (invalidSegments.length > 0) {
    let lastEnd = 0;
    const underline = invalidSegments.reduce((acc, segment) => {
      const spaces = " ".repeat(segment.start - lastEnd);
      const arrows = "^".repeat(segment.length);
      lastEnd = segment.start + segment.length;
      return acc + spaces + arrows;
    }, "");
    throw new OpenAIError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join(`
`)}
${path}
${underline}`);
  }
  return path;
};
var path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);

// node_modules/openai/resources/chat/completions/messages.mjs
class Messages extends APIResource {
  list(completionID, query = {}, options) {
    return this._client.getAPIList(path`/chat/completions/${completionID}/messages`, CursorPage, { query, ...options });
  }
}
// node_modules/openai/lib/parser.mjs
function isChatCompletionFunctionTool(tool) {
  return tool !== undefined && "function" in tool && tool.function !== undefined;
}
function isAutoParsableResponseFormat(response_format) {
  return response_format?.["$brand"] === "auto-parseable-response-format";
}
function isAutoParsableTool(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function maybeParseChatCompletion(completion, params) {
  if (!params || !hasAutoParseableInput(params)) {
    return {
      ...completion,
      choices: completion.choices.map((choice) => {
        assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
        return {
          ...choice,
          message: {
            ...choice.message,
            parsed: null,
            ...choice.message.tool_calls ? {
              tool_calls: choice.message.tool_calls
            } : undefined
          }
        };
      })
    };
  }
  return parseChatCompletion(completion, params);
}
function parseChatCompletion(completion, params) {
  const choices = completion.choices.map((choice) => {
    if (choice.finish_reason === "length") {
      throw new LengthFinishReasonError;
    }
    if (choice.finish_reason === "content_filter") {
      throw new ContentFilterFinishReasonError;
    }
    assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
    return {
      ...choice,
      message: {
        ...choice.message,
        ...choice.message.tool_calls ? {
          tool_calls: choice.message.tool_calls?.map((toolCall) => parseToolCall(params, toolCall)) ?? undefined
        } : undefined,
        parsed: choice.message.content && !choice.message.refusal ? parseResponseFormat(params, choice.message.content) : null
      }
    };
  });
  return { ...completion, choices };
}
function parseResponseFormat(params, content) {
  if (params.response_format?.type !== "json_schema") {
    return null;
  }
  if (params.response_format?.type === "json_schema") {
    if ("$parseRaw" in params.response_format) {
      const response_format = params.response_format;
      return response_format.$parseRaw(content);
    }
    return JSON.parse(content);
  }
  return null;
}
function parseToolCall(params, toolCall) {
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return {
    ...toolCall,
    function: {
      ...toolCall.function,
      parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCall.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCall.function.arguments) : null
    }
  };
}
function shouldParseToolCall(params, toolCall) {
  if (!params || !("tools" in params) || !params.tools) {
    return false;
  }
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return isChatCompletionFunctionTool(inputTool) && (isAutoParsableTool(inputTool) || inputTool?.function.strict || false);
}
function hasAutoParseableInput(params) {
  if (isAutoParsableResponseFormat(params.response_format)) {
    return true;
  }
  return params.tools?.some((t) => isAutoParsableTool(t) || t.type === "function" && t.function.strict === true) ?? false;
}
function assertToolCallsAreChatCompletionFunctionToolCalls(toolCalls) {
  for (const toolCall of toolCalls || []) {
    if (toolCall.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool calls are supported; Received \`${toolCall.type}\``);
    }
  }
}
function validateInputTools(tools) {
  for (const tool of tools ?? []) {
    if (tool.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool types support auto-parsing; Received \`${tool.type}\``);
    }
    if (tool.function.strict !== true) {
      throw new OpenAIError(`The \`${tool.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
    }
  }
}

// node_modules/openai/lib/chatCompletionUtils.mjs
var isAssistantMessage = (message) => {
  return message?.role === "assistant";
};
var isToolMessage = (message) => {
  return message?.role === "tool";
};

// node_modules/openai/lib/EventStream.mjs
var _EventStream_instances;
var _EventStream_connectedPromise;
var _EventStream_resolveConnectedPromise;
var _EventStream_rejectConnectedPromise;
var _EventStream_endPromise;
var _EventStream_resolveEndPromise;
var _EventStream_rejectEndPromise;
var _EventStream_listeners;
var _EventStream_ended;
var _EventStream_errored;
var _EventStream_aborted;
var _EventStream_catchingPromiseCreated;
var _EventStream_handleError;

class EventStream {
  constructor() {
    _EventStream_instances.add(this);
    this.controller = new AbortController;
    _EventStream_connectedPromise.set(this, undefined);
    _EventStream_resolveConnectedPromise.set(this, () => {});
    _EventStream_rejectConnectedPromise.set(this, () => {});
    _EventStream_endPromise.set(this, undefined);
    _EventStream_resolveEndPromise.set(this, () => {});
    _EventStream_rejectEndPromise.set(this, () => {});
    _EventStream_listeners.set(this, {});
    _EventStream_ended.set(this, false);
    _EventStream_errored.set(this, false);
    _EventStream_aborted.set(this, false);
    _EventStream_catchingPromiseCreated.set(this, false);
    __classPrivateFieldSet(this, _EventStream_connectedPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveConnectedPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet(this, _EventStream_endPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveEndPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet(this, _EventStream_connectedPromise, "f").catch(() => {});
    __classPrivateFieldGet(this, _EventStream_endPromise, "f").catch(() => {});
  }
  _run(executor) {
    setTimeout(() => {
      executor().then(() => {
        this._emitFinal();
        this._emit("end");
      }, __classPrivateFieldGet(this, _EventStream_instances, "m", _EventStream_handleError).bind(this));
    }, 0);
  }
  _connected() {
    if (this.ended)
      return;
    __classPrivateFieldGet(this, _EventStream_resolveConnectedPromise, "f").call(this);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet(this, _EventStream_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet(this, _EventStream_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet(this, _EventStream_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  on(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  off(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  once(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  emitted(event) {
    return new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve);
    });
  }
  async done() {
    __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet(this, _EventStream_endPromise, "f");
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet(this, _EventStream_ended, "f")) {
      return;
    }
    if (event === "end") {
      __classPrivateFieldSet(this, _EventStream_ended, true, "f");
      __classPrivateFieldGet(this, _EventStream_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error2 = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error2);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error2);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error2);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error2 = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error2);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error2);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error2);
      this._emit("end");
    }
  }
  _emitFinal() {}
}
_EventStream_connectedPromise = new WeakMap, _EventStream_resolveConnectedPromise = new WeakMap, _EventStream_rejectConnectedPromise = new WeakMap, _EventStream_endPromise = new WeakMap, _EventStream_resolveEndPromise = new WeakMap, _EventStream_rejectEndPromise = new WeakMap, _EventStream_listeners = new WeakMap, _EventStream_ended = new WeakMap, _EventStream_errored = new WeakMap, _EventStream_aborted = new WeakMap, _EventStream_catchingPromiseCreated = new WeakMap, _EventStream_instances = new WeakSet, _EventStream_handleError = function _EventStream_handleError2(error2) {
  __classPrivateFieldSet(this, _EventStream_errored, true, "f");
  if (error2 instanceof Error && error2.name === "AbortError") {
    error2 = new APIUserAbortError;
  }
  if (error2 instanceof APIUserAbortError) {
    __classPrivateFieldSet(this, _EventStream_aborted, true, "f");
    return this._emit("abort", error2);
  }
  if (error2 instanceof OpenAIError) {
    return this._emit("error", error2);
  }
  if (error2 instanceof Error) {
    const openAIError = new OpenAIError(error2.message);
    openAIError.cause = error2;
    return this._emit("error", openAIError);
  }
  return this._emit("error", new OpenAIError(String(error2)));
};

// node_modules/openai/lib/RunnableFunction.mjs
function isRunnableFunctionWithParse(fn) {
  return typeof fn.parse === "function";
}

// node_modules/openai/lib/AbstractChatCompletionRunner.mjs
var _AbstractChatCompletionRunner_instances;
var _AbstractChatCompletionRunner_getFinalContent;
var _AbstractChatCompletionRunner_getFinalMessage;
var _AbstractChatCompletionRunner_getFinalFunctionToolCall;
var _AbstractChatCompletionRunner_getFinalFunctionToolCallResult;
var _AbstractChatCompletionRunner_calculateTotalUsage;
var _AbstractChatCompletionRunner_validateParams;
var _AbstractChatCompletionRunner_stringifyFunctionCallResult;
var DEFAULT_MAX_CHAT_COMPLETIONS = 10;

class AbstractChatCompletionRunner extends EventStream {
  constructor() {
    super(...arguments);
    _AbstractChatCompletionRunner_instances.add(this);
    this._chatCompletions = [];
    this.messages = [];
  }
  _addChatCompletion(chatCompletion) {
    this._chatCompletions.push(chatCompletion);
    this._emit("chatCompletion", chatCompletion);
    const message = chatCompletion.choices[0]?.message;
    if (message)
      this._addMessage(message);
    return chatCompletion;
  }
  _addMessage(message, emit = true) {
    if (!("content" in message))
      message.content = null;
    this.messages.push(message);
    if (emit) {
      this._emit("message", message);
      if (isToolMessage(message) && message.content) {
        this._emit("functionToolCallResult", message.content);
      } else if (isAssistantMessage(message) && message.tool_calls) {
        for (const tool_call of message.tool_calls) {
          if (tool_call.type === "function") {
            this._emit("functionToolCall", tool_call.function);
          }
        }
      }
    }
  }
  async finalChatCompletion() {
    await this.done();
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (!completion)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return completion;
  }
  async finalContent() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
  }
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
  }
  async finalFunctionToolCall() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
  }
  async finalFunctionToolCallResult() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
  }
  async totalUsage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this);
  }
  allChatCompletions() {
    return [...this._chatCompletions];
  }
  _emitFinal() {
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (completion)
      this._emit("finalChatCompletion", completion);
    const finalMessage = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
    if (finalMessage)
      this._emit("finalMessage", finalMessage);
    const finalContent = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
    if (finalContent)
      this._emit("finalContent", finalContent);
    const finalFunctionCall = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
    if (finalFunctionCall)
      this._emit("finalFunctionToolCall", finalFunctionCall);
    const finalFunctionCallResult = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
    if (finalFunctionCallResult != null)
      this._emit("finalFunctionToolCallResult", finalFunctionCallResult);
    if (this._chatCompletions.some((c) => c.usage)) {
      this._emit("totalUsage", __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this));
    }
  }
  async _createChatCompletion(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_validateParams).call(this, params);
    const chatCompletion = await client.chat.completions.create({ ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addChatCompletion(parseChatCompletion(chatCompletion, params));
  }
  async _runChatCompletion(client, params, options) {
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    return await this._createChatCompletion(client, params, options);
  }
  async _runTools(client, params, options) {
    const role = "tool";
    const { tool_choice = "auto", stream, ...restParams } = params;
    const singleFunctionToCall = typeof tool_choice !== "string" && tool_choice.type === "function" && tool_choice?.function?.name;
    const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
    const inputTools = params.tools.map((tool) => {
      if (isAutoParsableTool(tool)) {
        if (!tool.$callback) {
          throw new OpenAIError("Tool given to `.runTools()` that does not have an associated function");
        }
        return {
          type: "function",
          function: {
            function: tool.$callback,
            name: tool.function.name,
            description: tool.function.description || "",
            parameters: tool.function.parameters,
            parse: tool.$parseRaw,
            strict: true
          }
        };
      }
      return tool;
    });
    const functionsByName = {};
    for (const f of inputTools) {
      if (f.type === "function") {
        functionsByName[f.function.name || f.function.function.name] = f.function;
      }
    }
    const tools = "tools" in params ? inputTools.map((t) => t.type === "function" ? {
      type: "function",
      function: {
        name: t.function.name || t.function.function.name,
        parameters: t.function.parameters,
        description: t.function.description,
        strict: t.function.strict
      }
    } : t) : undefined;
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    for (let i = 0;i < maxChatCompletions; ++i) {
      const chatCompletion = await this._createChatCompletion(client, {
        ...restParams,
        tool_choice,
        tools,
        messages: [...this.messages]
      }, options);
      const message = chatCompletion.choices[0]?.message;
      if (!message) {
        throw new OpenAIError(`missing message in ChatCompletion response`);
      }
      if (!message.tool_calls?.length) {
        return;
      }
      for (const tool_call of message.tool_calls) {
        if (tool_call.type !== "function")
          continue;
        const tool_call_id = tool_call.id;
        const { name, arguments: args } = tool_call.function;
        const fn = functionsByName[name];
        if (!fn) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. Available options are: ${Object.keys(functionsByName).map((name2) => JSON.stringify(name2)).join(", ")}. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        } else if (singleFunctionToCall && singleFunctionToCall !== name) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        let parsed;
        try {
          parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
        } catch (error2) {
          const content2 = error2 instanceof Error ? error2.message : String(error2);
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        const rawContent = await fn.function(parsed, this);
        const content = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
        this._addMessage({ role, tool_call_id, content });
        if (singleFunctionToCall) {
          return;
        }
      }
    }
    return;
  }
}
_AbstractChatCompletionRunner_instances = new WeakSet, _AbstractChatCompletionRunner_getFinalContent = function _AbstractChatCompletionRunner_getFinalContent2() {
  return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this).content ?? null;
}, _AbstractChatCompletionRunner_getFinalMessage = function _AbstractChatCompletionRunner_getFinalMessage2() {
  let i = this.messages.length;
  while (i-- > 0) {
    const message = this.messages[i];
    if (isAssistantMessage(message)) {
      const ret = {
        ...message,
        content: message.content ?? null,
        refusal: message.refusal ?? null
      };
      return ret;
    }
  }
  throw new OpenAIError("stream ended without producing a ChatCompletionMessage with role=assistant");
}, _AbstractChatCompletionRunner_getFinalFunctionToolCall = function _AbstractChatCompletionRunner_getFinalFunctionToolCall2() {
  for (let i = this.messages.length - 1;i >= 0; i--) {
    const message = this.messages[i];
    if (isAssistantMessage(message) && message?.tool_calls?.length) {
      return message.tool_calls.filter((x) => x.type === "function").at(-1)?.function;
    }
  }
  return;
}, _AbstractChatCompletionRunner_getFinalFunctionToolCallResult = function _AbstractChatCompletionRunner_getFinalFunctionToolCallResult2() {
  for (let i = this.messages.length - 1;i >= 0; i--) {
    const message = this.messages[i];
    if (isToolMessage(message) && message.content != null && typeof message.content === "string" && this.messages.some((x) => x.role === "assistant" && x.tool_calls?.some((y) => y.type === "function" && y.id === message.tool_call_id))) {
      return message.content;
    }
  }
  return;
}, _AbstractChatCompletionRunner_calculateTotalUsage = function _AbstractChatCompletionRunner_calculateTotalUsage2() {
  const total = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0
  };
  for (const { usage } of this._chatCompletions) {
    if (usage) {
      total.completion_tokens += usage.completion_tokens;
      total.prompt_tokens += usage.prompt_tokens;
      total.total_tokens += usage.total_tokens;
    }
  }
  return total;
}, _AbstractChatCompletionRunner_validateParams = function _AbstractChatCompletionRunner_validateParams2(params) {
  if (params.n != null && params.n > 1) {
    throw new OpenAIError("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
  }
}, _AbstractChatCompletionRunner_stringifyFunctionCallResult = function _AbstractChatCompletionRunner_stringifyFunctionCallResult2(rawContent) {
  return typeof rawContent === "string" ? rawContent : rawContent === undefined ? "undefined" : JSON.stringify(rawContent);
};

// node_modules/openai/lib/ChatCompletionRunner.mjs
class ChatCompletionRunner extends AbstractChatCompletionRunner {
  static runTools(client, params, options) {
    const runner = new ChatCompletionRunner;
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
  _addMessage(message, emit = true) {
    super._addMessage(message, emit);
    if (isAssistantMessage(message) && message.content) {
      this._emit("content", message.content);
    }
  }
}

// node_modules/openai/_vendor/partial-json-parser/parser.mjs
var STR = 1;
var NUM = 2;
var ARR = 4;
var OBJ = 8;
var NULL = 16;
var BOOL = 32;
var NAN = 64;
var INFINITY = 128;
var MINUS_INFINITY = 256;
var INF = INFINITY | MINUS_INFINITY;
var SPECIAL = NULL | BOOL | INF | NAN;
var ATOM = STR | NUM | SPECIAL;
var COLLECTION = ARR | OBJ;
var ALL = ATOM | COLLECTION;
var Allow = {
  STR,
  NUM,
  ARR,
  OBJ,
  NULL,
  BOOL,
  NAN,
  INFINITY,
  MINUS_INFINITY,
  INF,
  SPECIAL,
  ATOM,
  COLLECTION,
  ALL
};

class PartialJSON extends Error {
}

class MalformedJSON extends Error {
}
function parseJSON(jsonString, allowPartial = Allow.ALL) {
  if (typeof jsonString !== "string") {
    throw new TypeError(`expecting str, got ${typeof jsonString}`);
  }
  if (!jsonString.trim()) {
    throw new Error(`${jsonString} is empty`);
  }
  return _parseJSON(jsonString.trim(), allowPartial);
}
var _parseJSON = (jsonString, allow) => {
  const length = jsonString.length;
  let index = 0;
  const markPartialJSON = (msg) => {
    throw new PartialJSON(`${msg} at position ${index}`);
  };
  const throwMalformedError = (msg) => {
    throw new MalformedJSON(`${msg} at position ${index}`);
  };
  const parseAny = () => {
    skipBlank();
    if (index >= length)
      markPartialJSON("Unexpected end of input");
    if (jsonString[index] === '"')
      return parseStr();
    if (jsonString[index] === "{")
      return parseObj();
    if (jsonString[index] === "[")
      return parseArr();
    if (jsonString.substring(index, index + 4) === "null" || Allow.NULL & allow && length - index < 4 && "null".startsWith(jsonString.substring(index))) {
      index += 4;
      return null;
    }
    if (jsonString.substring(index, index + 4) === "true" || Allow.BOOL & allow && length - index < 4 && "true".startsWith(jsonString.substring(index))) {
      index += 4;
      return true;
    }
    if (jsonString.substring(index, index + 5) === "false" || Allow.BOOL & allow && length - index < 5 && "false".startsWith(jsonString.substring(index))) {
      index += 5;
      return false;
    }
    if (jsonString.substring(index, index + 8) === "Infinity" || Allow.INFINITY & allow && length - index < 8 && "Infinity".startsWith(jsonString.substring(index))) {
      index += 8;
      return Infinity;
    }
    if (jsonString.substring(index, index + 9) === "-Infinity" || Allow.MINUS_INFINITY & allow && 1 < length - index && length - index < 9 && "-Infinity".startsWith(jsonString.substring(index))) {
      index += 9;
      return -Infinity;
    }
    if (jsonString.substring(index, index + 3) === "NaN" || Allow.NAN & allow && length - index < 3 && "NaN".startsWith(jsonString.substring(index))) {
      index += 3;
      return NaN;
    }
    return parseNum();
  };
  const parseStr = () => {
    const start = index;
    let escape2 = false;
    index++;
    while (index < length && (jsonString[index] !== '"' || escape2 && jsonString[index - 1] === "\\")) {
      escape2 = jsonString[index] === "\\" ? !escape2 : false;
      index++;
    }
    if (jsonString.charAt(index) == '"') {
      try {
        return JSON.parse(jsonString.substring(start, ++index - Number(escape2)));
      } catch (e) {
        throwMalformedError(String(e));
      }
    } else if (Allow.STR & allow) {
      try {
        return JSON.parse(jsonString.substring(start, index - Number(escape2)) + '"');
      } catch (e) {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("\\")) + '"');
      }
    }
    markPartialJSON("Unterminated string literal");
  };
  const parseObj = () => {
    index++;
    skipBlank();
    const obj = {};
    try {
      while (jsonString[index] !== "}") {
        skipBlank();
        if (index >= length && Allow.OBJ & allow)
          return obj;
        const key = parseStr();
        skipBlank();
        index++;
        try {
          const value = parseAny();
          Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
        } catch (e) {
          if (Allow.OBJ & allow)
            return obj;
          else
            throw e;
        }
        skipBlank();
        if (jsonString[index] === ",")
          index++;
      }
    } catch (e) {
      if (Allow.OBJ & allow)
        return obj;
      else
        markPartialJSON("Expected '}' at end of object");
    }
    index++;
    return obj;
  };
  const parseArr = () => {
    index++;
    const arr = [];
    try {
      while (jsonString[index] !== "]") {
        arr.push(parseAny());
        skipBlank();
        if (jsonString[index] === ",") {
          index++;
        }
      }
    } catch (e) {
      if (Allow.ARR & allow) {
        return arr;
      }
      markPartialJSON("Expected ']' at end of array");
    }
    index++;
    return arr;
  };
  const parseNum = () => {
    if (index === 0) {
      if (jsonString === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        if (Allow.NUM & allow) {
          try {
            if (jsonString[jsonString.length - 1] === ".")
              return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf(".")));
            return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf("e")));
          } catch (e2) {}
        }
        throwMalformedError(String(e));
      }
    }
    const start = index;
    if (jsonString[index] === "-")
      index++;
    while (jsonString[index] && !",]}".includes(jsonString[index]))
      index++;
    if (index == length && !(Allow.NUM & allow))
      markPartialJSON("Unterminated number literal");
    try {
      return JSON.parse(jsonString.substring(start, index));
    } catch (e) {
      if (jsonString.substring(start, index) === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("e")));
      } catch (e2) {
        throwMalformedError(String(e2));
      }
    }
  };
  const skipBlank = () => {
    while (index < length && ` 
\r	`.includes(jsonString[index])) {
      index++;
    }
  };
  return parseAny();
};
var partialParse = (input) => parseJSON(input, Allow.ALL ^ Allow.NUM);
// node_modules/openai/lib/ChatCompletionStream.mjs
var _ChatCompletionStream_instances;
var _ChatCompletionStream_params;
var _ChatCompletionStream_choiceEventStates;
var _ChatCompletionStream_currentChatCompletionSnapshot;
var _ChatCompletionStream_beginRequest;
var _ChatCompletionStream_getChoiceEventState;
var _ChatCompletionStream_addChunk;
var _ChatCompletionStream_emitToolCallDoneEvent;
var _ChatCompletionStream_emitContentDoneEvents;
var _ChatCompletionStream_endRequest;
var _ChatCompletionStream_getAutoParseableResponseFormat;
var _ChatCompletionStream_accumulateChatCompletion;

class ChatCompletionStream extends AbstractChatCompletionRunner {
  constructor(params) {
    super();
    _ChatCompletionStream_instances.add(this);
    _ChatCompletionStream_params.set(this, undefined);
    _ChatCompletionStream_choiceEventStates.set(this, undefined);
    _ChatCompletionStream_currentChatCompletionSnapshot.set(this, undefined);
    __classPrivateFieldSet(this, _ChatCompletionStream_params, params, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
  }
  get currentChatCompletionSnapshot() {
    return __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
  }
  static fromReadableStream(stream) {
    const runner = new ChatCompletionStream(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createChatCompletion(client, params, options) {
    const runner = new ChatCompletionStream(params);
    runner._run(() => runner._runChatCompletion(client, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  async _createChatCompletion(client, params, options) {
    super._createChatCompletion;
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    const stream = await client.chat.completions.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const chunk of stream) {
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    let chatId;
    for await (const chunk of stream) {
      if (chatId && chatId !== chunk.id) {
        this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
      }
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
      chatId = chunk.id;
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  [(_ChatCompletionStream_params = new WeakMap, _ChatCompletionStream_choiceEventStates = new WeakMap, _ChatCompletionStream_currentChatCompletionSnapshot = new WeakMap, _ChatCompletionStream_instances = new WeakSet, _ChatCompletionStream_beginRequest = function _ChatCompletionStream_beginRequest() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, undefined, "f");
  }, _ChatCompletionStream_getChoiceEventState = function _ChatCompletionStream_getChoiceEventState(choice) {
    let state = __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index];
    if (state) {
      return state;
    }
    state = {
      content_done: false,
      refusal_done: false,
      logprobs_content_done: false,
      logprobs_refusal_done: false,
      done_tool_calls: new Set,
      current_tool_call_index: null
    };
    __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index] = state;
    return state;
  }, _ChatCompletionStream_addChunk = function _ChatCompletionStream_addChunk(chunk) {
    if (this.ended)
      return;
    const completion = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_accumulateChatCompletion).call(this, chunk);
    this._emit("chunk", chunk, completion);
    for (const choice of chunk.choices) {
      const choiceSnapshot = completion.choices[choice.index];
      if (choice.delta.content != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.content) {
        this._emit("content", choice.delta.content, choiceSnapshot.message.content);
        this._emit("content.delta", {
          delta: choice.delta.content,
          snapshot: choiceSnapshot.message.content,
          parsed: choiceSnapshot.message.parsed
        });
      }
      if (choice.delta.refusal != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.refusal) {
        this._emit("refusal.delta", {
          delta: choice.delta.refusal,
          snapshot: choiceSnapshot.message.refusal
        });
      }
      if (choice.logprobs?.content != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.content.delta", {
          content: choice.logprobs?.content,
          snapshot: choiceSnapshot.logprobs?.content ?? []
        });
      }
      if (choice.logprobs?.refusal != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.refusal.delta", {
          refusal: choice.logprobs?.refusal,
          snapshot: choiceSnapshot.logprobs?.refusal ?? []
        });
      }
      const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
      if (choiceSnapshot.finish_reason) {
        __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
        if (state.current_tool_call_index != null) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
        }
      }
      for (const toolCall of choice.delta.tool_calls ?? []) {
        if (state.current_tool_call_index !== toolCall.index) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
          if (state.current_tool_call_index != null) {
            __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
          }
        }
        state.current_tool_call_index = toolCall.index;
      }
      for (const toolCallDelta of choice.delta.tool_calls ?? []) {
        const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallDelta.index];
        if (!toolCallSnapshot?.type) {
          continue;
        }
        if (toolCallSnapshot?.type === "function") {
          this._emit("tool_calls.function.arguments.delta", {
            name: toolCallSnapshot.function?.name,
            index: toolCallDelta.index,
            arguments: toolCallSnapshot.function.arguments,
            parsed_arguments: toolCallSnapshot.function.parsed_arguments,
            arguments_delta: toolCallDelta.function?.arguments ?? ""
          });
        } else {
          assertNever(toolCallSnapshot?.type);
        }
      }
    }
  }, _ChatCompletionStream_emitToolCallDoneEvent = function _ChatCompletionStream_emitToolCallDoneEvent(choiceSnapshot, toolCallIndex) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (state.done_tool_calls.has(toolCallIndex)) {
      return;
    }
    const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallIndex];
    if (!toolCallSnapshot) {
      throw new Error("no tool call snapshot");
    }
    if (!toolCallSnapshot.type) {
      throw new Error("tool call snapshot missing `type`");
    }
    if (toolCallSnapshot.type === "function") {
      const inputTool = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.tools?.find((tool) => isChatCompletionFunctionTool(tool) && tool.function.name === toolCallSnapshot.function.name);
      this._emit("tool_calls.function.arguments.done", {
        name: toolCallSnapshot.function.name,
        index: toolCallIndex,
        arguments: toolCallSnapshot.function.arguments,
        parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCallSnapshot.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCallSnapshot.function.arguments) : null
      });
    } else {
      assertNever(toolCallSnapshot.type);
    }
  }, _ChatCompletionStream_emitContentDoneEvents = function _ChatCompletionStream_emitContentDoneEvents(choiceSnapshot) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (choiceSnapshot.message.content && !state.content_done) {
      state.content_done = true;
      const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this);
      this._emit("content.done", {
        content: choiceSnapshot.message.content,
        parsed: responseFormat ? responseFormat.$parseRaw(choiceSnapshot.message.content) : null
      });
    }
    if (choiceSnapshot.message.refusal && !state.refusal_done) {
      state.refusal_done = true;
      this._emit("refusal.done", { refusal: choiceSnapshot.message.refusal });
    }
    if (choiceSnapshot.logprobs?.content && !state.logprobs_content_done) {
      state.logprobs_content_done = true;
      this._emit("logprobs.content.done", { content: choiceSnapshot.logprobs.content });
    }
    if (choiceSnapshot.logprobs?.refusal && !state.logprobs_refusal_done) {
      state.logprobs_refusal_done = true;
      this._emit("logprobs.refusal.done", { refusal: choiceSnapshot.logprobs.refusal });
    }
  }, _ChatCompletionStream_endRequest = function _ChatCompletionStream_endRequest() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, undefined, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
    return finalizeChatCompletion(snapshot, __classPrivateFieldGet(this, _ChatCompletionStream_params, "f"));
  }, _ChatCompletionStream_getAutoParseableResponseFormat = function _ChatCompletionStream_getAutoParseableResponseFormat() {
    const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.response_format;
    if (isAutoParsableResponseFormat(responseFormat)) {
      return responseFormat;
    }
    return null;
  }, _ChatCompletionStream_accumulateChatCompletion = function _ChatCompletionStream_accumulateChatCompletion(chunk) {
    var _a, _b, _c, _d;
    let snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    const { choices, ...rest } = chunk;
    if (!snapshot) {
      snapshot = __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, {
        ...rest,
        choices: []
      }, "f");
    } else {
      Object.assign(snapshot, rest);
    }
    for (const { delta, finish_reason, index, logprobs = null, ...other } of chunk.choices) {
      let choice = snapshot.choices[index];
      if (!choice) {
        choice = snapshot.choices[index] = { finish_reason, index, message: {}, logprobs, ...other };
      }
      if (logprobs) {
        if (!choice.logprobs) {
          choice.logprobs = Object.assign({}, logprobs);
        } else {
          const { content: content2, refusal: refusal2, ...rest3 } = logprobs;
          assertIsEmpty(rest3);
          Object.assign(choice.logprobs, rest3);
          if (content2) {
            (_a = choice.logprobs).content ?? (_a.content = []);
            choice.logprobs.content.push(...content2);
          }
          if (refusal2) {
            (_b = choice.logprobs).refusal ?? (_b.refusal = []);
            choice.logprobs.refusal.push(...refusal2);
          }
        }
      }
      if (finish_reason) {
        choice.finish_reason = finish_reason;
        if (__classPrivateFieldGet(this, _ChatCompletionStream_params, "f") && hasAutoParseableInput(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"))) {
          if (finish_reason === "length") {
            throw new LengthFinishReasonError;
          }
          if (finish_reason === "content_filter") {
            throw new ContentFilterFinishReasonError;
          }
        }
      }
      Object.assign(choice, other);
      if (!delta)
        continue;
      const { content, refusal, function_call, role, tool_calls, ...rest2 } = delta;
      assertIsEmpty(rest2);
      Object.assign(choice.message, rest2);
      if (refusal) {
        choice.message.refusal = (choice.message.refusal || "") + refusal;
      }
      if (role)
        choice.message.role = role;
      if (function_call) {
        if (!choice.message.function_call) {
          choice.message.function_call = function_call;
        } else {
          if (function_call.name)
            choice.message.function_call.name = function_call.name;
          if (function_call.arguments) {
            (_c = choice.message.function_call).arguments ?? (_c.arguments = "");
            choice.message.function_call.arguments += function_call.arguments;
          }
        }
      }
      if (content) {
        choice.message.content = (choice.message.content || "") + content;
        if (!choice.message.refusal && __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this)) {
          choice.message.parsed = partialParse(choice.message.content);
        }
      }
      if (tool_calls) {
        if (!choice.message.tool_calls)
          choice.message.tool_calls = [];
        for (const { index: index2, id, type, function: fn, ...rest3 } of tool_calls) {
          const tool_call = (_d = choice.message.tool_calls)[index2] ?? (_d[index2] = {});
          Object.assign(tool_call, rest3);
          if (id)
            tool_call.id = id;
          if (type)
            tool_call.type = type;
          if (fn)
            tool_call.function ?? (tool_call.function = { name: fn.name ?? "", arguments: "" });
          if (fn?.name)
            tool_call.function.name = fn.name;
          if (fn?.arguments) {
            tool_call.function.arguments += fn.arguments;
            if (shouldParseToolCall(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"), tool_call)) {
              tool_call.function.parsed_arguments = partialParse(tool_call.function.arguments);
            }
          }
        }
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("chunk", (chunk) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(chunk);
      } else {
        pushQueue.push(chunk);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(undefined);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: undefined, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: undefined, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: undefined, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
}
function finalizeChatCompletion(snapshot, params) {
  const { id, choices, created, model, system_fingerprint, ...rest } = snapshot;
  const completion = {
    ...rest,
    id,
    choices: choices.map(({ message, finish_reason, index, logprobs, ...choiceRest }) => {
      if (!finish_reason) {
        throw new OpenAIError(`missing finish_reason for choice ${index}`);
      }
      const { content = null, function_call, tool_calls, ...messageRest } = message;
      const role = message.role;
      if (!role) {
        throw new OpenAIError(`missing role for choice ${index}`);
      }
      if (function_call) {
        const { arguments: args, name } = function_call;
        if (args == null) {
          throw new OpenAIError(`missing function_call.arguments for choice ${index}`);
        }
        if (!name) {
          throw new OpenAIError(`missing function_call.name for choice ${index}`);
        }
        return {
          ...choiceRest,
          message: {
            content,
            function_call: { arguments: args, name },
            role,
            refusal: message.refusal ?? null
          },
          finish_reason,
          index,
          logprobs
        };
      }
      if (tool_calls) {
        return {
          ...choiceRest,
          index,
          finish_reason,
          logprobs,
          message: {
            ...messageRest,
            role,
            content,
            refusal: message.refusal ?? null,
            tool_calls: tool_calls.map((tool_call, i) => {
              const { function: fn, type, id: id2, ...toolRest } = tool_call;
              const { arguments: args, name, ...fnRest } = fn || {};
              if (id2 == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].id
${str(snapshot)}`);
              }
              if (type == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].type
${str(snapshot)}`);
              }
              if (name == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.name
${str(snapshot)}`);
              }
              if (args == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.arguments
${str(snapshot)}`);
              }
              return { ...toolRest, id: id2, type, function: { ...fnRest, name, arguments: args } };
            })
          }
        };
      }
      return {
        ...choiceRest,
        message: { ...messageRest, content, role, refusal: message.refusal ?? null },
        finish_reason,
        index,
        logprobs
      };
    }),
    created,
    model,
    object: "chat.completion",
    ...system_fingerprint ? { system_fingerprint } : {}
  };
  return maybeParseChatCompletion(completion, params);
}
function str(x) {
  return JSON.stringify(x);
}
function assertIsEmpty(obj) {
  return;
}
function assertNever(_x) {}

// node_modules/openai/lib/ChatCompletionStreamingRunner.mjs
class ChatCompletionStreamingRunner extends ChatCompletionStream {
  static fromReadableStream(stream) {
    const runner = new ChatCompletionStreamingRunner(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static runTools(client, params, options) {
    const runner = new ChatCompletionStreamingRunner(params);
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
}

// node_modules/openai/resources/chat/completions/completions.mjs
class Completions extends APIResource {
  constructor() {
    super(...arguments);
    this.messages = new Messages(this._client);
  }
  create(body, options) {
    return this._client.post("/chat/completions", { body, ...options, stream: body.stream ?? false });
  }
  retrieve(completionID, options) {
    return this._client.get(path`/chat/completions/${completionID}`, options);
  }
  update(completionID, body, options) {
    return this._client.post(path`/chat/completions/${completionID}`, { body, ...options });
  }
  list(query = {}, options) {
    return this._client.getAPIList("/chat/completions", CursorPage, { query, ...options });
  }
  delete(completionID, options) {
    return this._client.delete(path`/chat/completions/${completionID}`, options);
  }
  parse(body, options) {
    validateInputTools(body.tools);
    return this._client.chat.completions.create(body, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Stainless-Helper-Method": "chat.completions.parse"
      }
    })._thenUnwrap((completion) => parseChatCompletion(completion, body));
  }
  runTools(body, options) {
    if (body.stream) {
      return ChatCompletionStreamingRunner.runTools(this._client, body, options);
    }
    return ChatCompletionRunner.runTools(this._client, body, options);
  }
  stream(body, options) {
    return ChatCompletionStream.createChatCompletion(this._client, body, options);
  }
}
Completions.Messages = Messages;

// node_modules/openai/resources/chat/chat.mjs
class Chat extends APIResource {
  constructor() {
    super(...arguments);
    this.completions = new Completions(this._client);
  }
}
Chat.Completions = Completions;
// node_modules/openai/internal/headers.mjs
var brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === undefined)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
var buildHeaders = (newHeaders) => {
  const targetHeaders = new Headers;
  const nullHeaders = new Set;
  for (const headers of newHeaders) {
    const seenHeaders = new Set;
    for (const [name, value] of iterateHeaders(headers)) {
      const lowerName = name.toLowerCase();
      if (!seenHeaders.has(lowerName)) {
        targetHeaders.delete(name);
        seenHeaders.add(lowerName);
      }
      if (value === null) {
        targetHeaders.delete(name);
        nullHeaders.add(lowerName);
      } else {
        targetHeaders.append(name, value);
        nullHeaders.delete(lowerName);
      }
    }
  }
  return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
};

// node_modules/openai/resources/audio/speech.mjs
class Speech extends APIResource {
  create(body, options) {
    return this._client.post("/audio/speech", {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "application/octet-stream" }, options?.headers]),
      __binaryResponse: true
    });
  }
}

// node_modules/openai/resources/audio/transcriptions.mjs
class Transcriptions extends APIResource {
  create(body, options) {
    return this._client.post("/audio/transcriptions", multipartFormRequestOptions({
      body,
      ...options,
      stream: body.stream ?? false,
      __metadata: { model: body.model }
    }, this._client));
  }
}

// node_modules/openai/resources/audio/translations.mjs
class Translations extends APIResource {
  create(body, options) {
    return this._client.post("/audio/translations", multipartFormRequestOptions({ body, ...options, __metadata: { model: body.model } }, this._client));
  }
}

// node_modules/openai/resources/audio/audio.mjs
class Audio extends APIResource {
  constructor() {
    super(...arguments);
    this.transcriptions = new Transcriptions(this._client);
    this.translations = new Translations(this._client);
    this.speech = new Speech(this._client);
  }
}
Audio.Transcriptions = Transcriptions;
Audio.Translations = Translations;
Audio.Speech = Speech;
// node_modules/openai/resources/batches.mjs
class Batches extends APIResource {
  create(body, options) {
    return this._client.post("/batches", { body, ...options });
  }
  retrieve(batchID, options) {
    return this._client.get(path`/batches/${batchID}`, options);
  }
  list(query = {}, options) {
    return this._client.getAPIList("/batches", CursorPage, { query, ...options });
  }
  cancel(batchID, options) {
    return this._client.post(path`/batches/${batchID}/cancel`, options);
  }
}
// node_modules/openai/resources/beta/assistants.mjs
class Assistants extends APIResource {
  create(body, options) {
    return this._client.post("/assistants", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(assistantID, options) {
    return this._client.get(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(assistantID, body, options) {
    return this._client.post(path`/assistants/${assistantID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(query = {}, options) {
    return this._client.getAPIList("/assistants", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  delete(assistantID, options) {
    return this._client.delete(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}

// node_modules/openai/resources/beta/realtime/sessions.mjs
class Sessions extends APIResource {
  create(body, options) {
    return this._client.post("/realtime/sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}

// node_modules/openai/resources/beta/realtime/transcription-sessions.mjs
class TranscriptionSessions extends APIResource {
  create(body, options) {
    return this._client.post("/realtime/transcription_sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}

// node_modules/openai/resources/beta/realtime/realtime.mjs
class Realtime extends APIResource {
  constructor() {
    super(...arguments);
    this.sessions = new Sessions(this._client);
    this.transcriptionSessions = new TranscriptionSessions(this._client);
  }
}
Realtime.Sessions = Sessions;
Realtime.TranscriptionSessions = TranscriptionSessions;

// node_modules/openai/resources/beta/threads/messages.mjs
class Messages2 extends APIResource {
  create(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}/messages`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(messageID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(messageID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/messages/${messageID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/messages`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  delete(messageID, params, options) {
    const { thread_id } = params;
    return this._client.delete(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}

// node_modules/openai/resources/beta/threads/runs/steps.mjs
class Steps extends APIResource {
  retrieve(stepID, params, options) {
    const { thread_id, run_id, ...query } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${run_id}/steps/${stepID}`, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(runID, params, options) {
    const { thread_id, ...query } = params;
    return this._client.getAPIList(path`/threads/${thread_id}/runs/${runID}/steps`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}
// node_modules/openai/internal/utils/base64.mjs
var toFloat32Array = (base64Str) => {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64Str, "base64");
    return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.length / Float32Array.BYTES_PER_ELEMENT));
  } else {
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0;i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return Array.from(new Float32Array(bytes.buffer));
  }
};
// node_modules/openai/internal/utils/env.mjs
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() ?? undefined;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim();
  }
  return;
};
// node_modules/openai/lib/AssistantStream.mjs
var _AssistantStream_instances;
var _a;
var _AssistantStream_events;
var _AssistantStream_runStepSnapshots;
var _AssistantStream_messageSnapshots;
var _AssistantStream_messageSnapshot;
var _AssistantStream_finalRun;
var _AssistantStream_currentContentIndex;
var _AssistantStream_currentContent;
var _AssistantStream_currentToolCallIndex;
var _AssistantStream_currentToolCall;
var _AssistantStream_currentEvent;
var _AssistantStream_currentRunSnapshot;
var _AssistantStream_currentRunStepSnapshot;
var _AssistantStream_addEvent;
var _AssistantStream_endRequest;
var _AssistantStream_handleMessage;
var _AssistantStream_handleRunStep;
var _AssistantStream_handleEvent;
var _AssistantStream_accumulateRunStep;
var _AssistantStream_accumulateMessage;
var _AssistantStream_accumulateContent;
var _AssistantStream_handleRun;

class AssistantStream extends EventStream {
  constructor() {
    super(...arguments);
    _AssistantStream_instances.add(this);
    _AssistantStream_events.set(this, []);
    _AssistantStream_runStepSnapshots.set(this, {});
    _AssistantStream_messageSnapshots.set(this, {});
    _AssistantStream_messageSnapshot.set(this, undefined);
    _AssistantStream_finalRun.set(this, undefined);
    _AssistantStream_currentContentIndex.set(this, undefined);
    _AssistantStream_currentContent.set(this, undefined);
    _AssistantStream_currentToolCallIndex.set(this, undefined);
    _AssistantStream_currentToolCall.set(this, undefined);
    _AssistantStream_currentEvent.set(this, undefined);
    _AssistantStream_currentRunSnapshot.set(this, undefined);
    _AssistantStream_currentRunStepSnapshot.set(this, undefined);
  }
  [(_AssistantStream_events = new WeakMap, _AssistantStream_runStepSnapshots = new WeakMap, _AssistantStream_messageSnapshots = new WeakMap, _AssistantStream_messageSnapshot = new WeakMap, _AssistantStream_finalRun = new WeakMap, _AssistantStream_currentContentIndex = new WeakMap, _AssistantStream_currentContent = new WeakMap, _AssistantStream_currentToolCallIndex = new WeakMap, _AssistantStream_currentToolCall = new WeakMap, _AssistantStream_currentEvent = new WeakMap, _AssistantStream_currentRunSnapshot = new WeakMap, _AssistantStream_currentRunStepSnapshot = new WeakMap, _AssistantStream_instances = new WeakSet, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(undefined);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: undefined, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: undefined, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: undefined, done: true };
      }
    };
  }
  static fromReadableStream(stream) {
    const runner = new _a;
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
  static createToolAssistantStream(runId, runs, params, options) {
    const runner = new _a;
    runner._run(() => runner._runToolAssistantStream(runId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createToolAssistantStream(run, runId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.submitToolOutputs(runId, body, {
      ...options,
      signal: this.controller.signal
    });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static createThreadAssistantStream(params, thread, options) {
    const runner = new _a;
    runner._run(() => runner._threadAssistantStream(params, thread, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  static createAssistantStream(threadId, runs, params, options) {
    const runner = new _a;
    runner._run(() => runner._runAssistantStream(threadId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  currentEvent() {
    return __classPrivateFieldGet(this, _AssistantStream_currentEvent, "f");
  }
  currentRun() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunSnapshot, "f");
  }
  currentMessageSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f");
  }
  currentRunStepSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunStepSnapshot, "f");
  }
  async finalRunSteps() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f"));
  }
  async finalMessages() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f"));
  }
  async finalRun() {
    await this.done();
    if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
      throw Error("Final run was not received.");
    return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
  }
  async _createThreadAssistantStream(thread, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await thread.createAndRun(body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  async _createAssistantStream(run, threadId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.create(threadId, body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static accumulateDelta(acc, delta) {
    for (const [key, deltaValue] of Object.entries(delta)) {
      if (!acc.hasOwnProperty(key)) {
        acc[key] = deltaValue;
        continue;
      }
      let accValue = acc[key];
      if (accValue === null || accValue === undefined) {
        acc[key] = deltaValue;
        continue;
      }
      if (key === "index" || key === "type") {
        acc[key] = deltaValue;
        continue;
      }
      if (typeof accValue === "string" && typeof deltaValue === "string") {
        accValue += deltaValue;
      } else if (typeof accValue === "number" && typeof deltaValue === "number") {
        accValue += deltaValue;
      } else if (isObj(accValue) && isObj(deltaValue)) {
        accValue = this.accumulateDelta(accValue, deltaValue);
      } else if (Array.isArray(accValue) && Array.isArray(deltaValue)) {
        if (accValue.every((x) => typeof x === "string" || typeof x === "number")) {
          accValue.push(...deltaValue);
          continue;
        }
        for (const deltaEntry of deltaValue) {
          if (!isObj(deltaEntry)) {
            throw new Error(`Expected array delta entry to be an object but got: ${deltaEntry}`);
          }
          const index = deltaEntry["index"];
          if (index == null) {
            console.error(deltaEntry);
            throw new Error("Expected array delta entry to have an `index` property");
          }
          if (typeof index !== "number") {
            throw new Error(`Expected array delta entry \`index\` property to be a number but got ${index}`);
          }
          const accEntry = accValue[index];
          if (accEntry == null) {
            accValue.push(deltaEntry);
          } else {
            accValue[index] = this.accumulateDelta(accEntry, deltaEntry);
          }
        }
        continue;
      } else {
        throw Error(`Unhandled record type: ${key}, deltaValue: ${deltaValue}, accValue: ${accValue}`);
      }
      acc[key] = accValue;
    }
    return acc;
  }
  _addRun(run) {
    return run;
  }
  async _threadAssistantStream(params, thread, options) {
    return await this._createThreadAssistantStream(thread, params, options);
  }
  async _runAssistantStream(threadId, runs, params, options) {
    return await this._createAssistantStream(runs, threadId, params, options);
  }
  async _runToolAssistantStream(runId, runs, params, options) {
    return await this._createToolAssistantStream(runs, runId, params, options);
  }
}
_a = AssistantStream, _AssistantStream_addEvent = function _AssistantStream_addEvent2(event) {
  if (this.ended)
    return;
  __classPrivateFieldSet(this, _AssistantStream_currentEvent, event, "f");
  __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleEvent).call(this, event);
  switch (event.event) {
    case "thread.created":
      break;
    case "thread.run.created":
    case "thread.run.queued":
    case "thread.run.in_progress":
    case "thread.run.requires_action":
    case "thread.run.completed":
    case "thread.run.incomplete":
    case "thread.run.failed":
    case "thread.run.cancelling":
    case "thread.run.cancelled":
    case "thread.run.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRun).call(this, event);
      break;
    case "thread.run.step.created":
    case "thread.run.step.in_progress":
    case "thread.run.step.delta":
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRunStep).call(this, event);
      break;
    case "thread.message.created":
    case "thread.message.in_progress":
    case "thread.message.delta":
    case "thread.message.completed":
    case "thread.message.incomplete":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleMessage).call(this, event);
      break;
    case "error":
      throw new Error("Encountered an error event in event processing - errors should be processed earlier");
    default:
      assertNever2(event);
  }
}, _AssistantStream_endRequest = function _AssistantStream_endRequest2() {
  if (this.ended) {
    throw new OpenAIError(`stream has ended, this shouldn't happen`);
  }
  if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
    throw Error("Final run has not been received");
  return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
}, _AssistantStream_handleMessage = function _AssistantStream_handleMessage2(event) {
  const [accumulatedMessage, newContent] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateMessage).call(this, event, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
  __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, accumulatedMessage, "f");
  __classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f")[accumulatedMessage.id] = accumulatedMessage;
  for (const content of newContent) {
    const snapshotContent = accumulatedMessage.content[content.index];
    if (snapshotContent?.type == "text") {
      this._emit("textCreated", snapshotContent.text);
    }
  }
  switch (event.event) {
    case "thread.message.created":
      this._emit("messageCreated", event.data);
      break;
    case "thread.message.in_progress":
      break;
    case "thread.message.delta":
      this._emit("messageDelta", event.data.delta, accumulatedMessage);
      if (event.data.delta.content) {
        for (const content of event.data.delta.content) {
          if (content.type == "text" && content.text) {
            let textDelta = content.text;
            let snapshot = accumulatedMessage.content[content.index];
            if (snapshot && snapshot.type == "text") {
              this._emit("textDelta", textDelta, snapshot.text);
            } else {
              throw Error("The snapshot associated with this text delta is not text or missing");
            }
          }
          if (content.index != __classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")) {
            if (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f")) {
              switch (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f").type) {
                case "text":
                  this._emit("textDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
                case "image_file":
                  this._emit("imageFileDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
              }
            }
            __classPrivateFieldSet(this, _AssistantStream_currentContentIndex, content.index, "f");
          }
          __classPrivateFieldSet(this, _AssistantStream_currentContent, accumulatedMessage.content[content.index], "f");
        }
      }
      break;
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f") !== undefined) {
        const currentContent = event.data.content[__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")];
        if (currentContent) {
          switch (currentContent.type) {
            case "image_file":
              this._emit("imageFileDone", currentContent.image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
            case "text":
              this._emit("textDone", currentContent.text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
          }
        }
      }
      if (__classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f")) {
        this._emit("messageDone", event.data);
      }
      __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, undefined, "f");
  }
}, _AssistantStream_handleRunStep = function _AssistantStream_handleRunStep2(event) {
  const accumulatedRunStep = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateRunStep).call(this, event);
  __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, accumulatedRunStep, "f");
  switch (event.event) {
    case "thread.run.step.created":
      this._emit("runStepCreated", event.data);
      break;
    case "thread.run.step.delta":
      const delta = event.data.delta;
      if (delta.step_details && delta.step_details.type == "tool_calls" && delta.step_details.tool_calls && accumulatedRunStep.step_details.type == "tool_calls") {
        for (const toolCall of delta.step_details.tool_calls) {
          if (toolCall.index == __classPrivateFieldGet(this, _AssistantStream_currentToolCallIndex, "f")) {
            this._emit("toolCallDelta", toolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index]);
          } else {
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
              this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
            }
            __classPrivateFieldSet(this, _AssistantStream_currentToolCallIndex, toolCall.index, "f");
            __classPrivateFieldSet(this, _AssistantStream_currentToolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index], "f");
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"))
              this._emit("toolCallCreated", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          }
        }
      }
      this._emit("runStepDelta", event.data.delta, accumulatedRunStep);
      break;
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, undefined, "f");
      const details = event.data.step_details;
      if (details.type == "tool_calls") {
        if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
          this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          __classPrivateFieldSet(this, _AssistantStream_currentToolCall, undefined, "f");
        }
      }
      this._emit("runStepDone", event.data, accumulatedRunStep);
      break;
    case "thread.run.step.in_progress":
      break;
  }
}, _AssistantStream_handleEvent = function _AssistantStream_handleEvent2(event) {
  __classPrivateFieldGet(this, _AssistantStream_events, "f").push(event);
  this._emit("event", event);
}, _AssistantStream_accumulateRunStep = function _AssistantStream_accumulateRunStep2(event) {
  switch (event.event) {
    case "thread.run.step.created":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      return event.data;
    case "thread.run.step.delta":
      let snapshot = __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
      if (!snapshot) {
        throw Error("Received a RunStepDelta before creation of a snapshot");
      }
      let data = event.data;
      if (data.delta) {
        const accumulated = _a.accumulateDelta(snapshot, data.delta);
        __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = accumulated;
      }
      return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
    case "thread.run.step.in_progress":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      break;
  }
  if (__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id])
    return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
  throw new Error("No snapshot available");
}, _AssistantStream_accumulateMessage = function _AssistantStream_accumulateMessage2(event, snapshot) {
  let newContent = [];
  switch (event.event) {
    case "thread.message.created":
      return [event.data, newContent];
    case "thread.message.delta":
      if (!snapshot) {
        throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
      }
      let data = event.data;
      if (data.delta.content) {
        for (const contentElement of data.delta.content) {
          if (contentElement.index in snapshot.content) {
            let currentContent = snapshot.content[contentElement.index];
            snapshot.content[contentElement.index] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateContent).call(this, contentElement, currentContent);
          } else {
            snapshot.content[contentElement.index] = contentElement;
            newContent.push(contentElement);
          }
        }
      }
      return [snapshot, newContent];
    case "thread.message.in_progress":
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (snapshot) {
        return [snapshot, newContent];
      } else {
        throw Error("Received thread message event with no existing snapshot");
      }
  }
  throw Error("Tried to accumulate a non-message event");
}, _AssistantStream_accumulateContent = function _AssistantStream_accumulateContent2(contentElement, currentContent) {
  return _a.accumulateDelta(currentContent, contentElement);
}, _AssistantStream_handleRun = function _AssistantStream_handleRun2(event) {
  __classPrivateFieldSet(this, _AssistantStream_currentRunSnapshot, event.data, "f");
  switch (event.event) {
    case "thread.run.created":
      break;
    case "thread.run.queued":
      break;
    case "thread.run.in_progress":
      break;
    case "thread.run.requires_action":
    case "thread.run.cancelled":
    case "thread.run.failed":
    case "thread.run.completed":
    case "thread.run.expired":
    case "thread.run.incomplete":
      __classPrivateFieldSet(this, _AssistantStream_finalRun, event.data, "f");
      if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
        this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
        __classPrivateFieldSet(this, _AssistantStream_currentToolCall, undefined, "f");
      }
      break;
    case "thread.run.cancelling":
      break;
  }
};
function assertNever2(_x) {}

// node_modules/openai/resources/beta/threads/runs/runs.mjs
class Runs extends APIResource {
  constructor() {
    super(...arguments);
    this.steps = new Steps(this._client);
  }
  create(threadID, params, options) {
    const { include, ...body } = params;
    return this._client.post(path`/threads/${threadID}/runs`, {
      query: { include },
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false
    });
  }
  retrieve(runID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${runID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/runs`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  cancel(runID, params, options) {
    const { thread_id } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  async createAndPoll(threadId, body, options) {
    const run = await this.create(threadId, body, options);
    return await this.poll(run.id, { thread_id: threadId }, options);
  }
  createAndStream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  async poll(runId, params, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? undefined
      }
    ]);
    while (true) {
      const { data: run, response } = await this.retrieve(runId, params, {
        ...options,
        headers: { ...options?.headers, ...headers }
      }).withResponse();
      switch (run.status) {
        case "queued":
        case "in_progress":
        case "cancelling":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return run;
      }
    }
  }
  stream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  submitToolOutputs(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/submit_tool_outputs`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false
    });
  }
  async submitToolOutputsAndPoll(runId, params, options) {
    const run = await this.submitToolOutputs(runId, params, options);
    return await this.poll(run.id, params, options);
  }
  submitToolOutputsStream(runId, params, options) {
    return AssistantStream.createToolAssistantStream(runId, this._client.beta.threads.runs, params, options);
  }
}
Runs.Steps = Steps;

// node_modules/openai/resources/beta/threads/threads.mjs
class Threads extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs(this._client);
    this.messages = new Messages2(this._client);
  }
  create(body = {}, options) {
    return this._client.post("/threads", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(threadID, options) {
    return this._client.get(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  delete(threadID, options) {
    return this._client.delete(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  createAndRun(body, options) {
    return this._client.post("/threads/runs", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: body.stream ?? false
    });
  }
  async createAndRunPoll(body, options) {
    const run = await this.createAndRun(body, options);
    return await this.runs.poll(run.id, { thread_id: run.thread_id }, options);
  }
  createAndRunStream(body, options) {
    return AssistantStream.createThreadAssistantStream(body, this._client.beta.threads, options);
  }
}
Threads.Runs = Runs;
Threads.Messages = Messages2;

// node_modules/openai/resources/beta/beta.mjs
class Beta extends APIResource {
  constructor() {
    super(...arguments);
    this.realtime = new Realtime(this._client);
    this.assistants = new Assistants(this._client);
    this.threads = new Threads(this._client);
  }
}
Beta.Realtime = Realtime;
Beta.Assistants = Assistants;
Beta.Threads = Threads;
// node_modules/openai/resources/completions.mjs
class Completions2 extends APIResource {
  create(body, options) {
    return this._client.post("/completions", { body, ...options, stream: body.stream ?? false });
  }
}
// node_modules/openai/resources/containers/files/content.mjs
class Content extends APIResource {
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
}

// node_modules/openai/resources/containers/files/files.mjs
class Files extends APIResource {
  constructor() {
    super(...arguments);
    this.content = new Content(this._client);
  }
  create(containerID, body, options) {
    return this._client.post(path`/containers/${containerID}/files`, multipartFormRequestOptions({ body, ...options }, this._client));
  }
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}`, options);
  }
  list(containerID, query = {}, options) {
    return this._client.getAPIList(path`/containers/${containerID}/files`, CursorPage, {
      query,
      ...options
    });
  }
  delete(fileID, params, options) {
    const { container_id } = params;
    return this._client.delete(path`/containers/${container_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
}
Files.Content = Content;

// node_modules/openai/resources/containers/containers.mjs
class Containers extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files(this._client);
  }
  create(body, options) {
    return this._client.post("/containers", { body, ...options });
  }
  retrieve(containerID, options) {
    return this._client.get(path`/containers/${containerID}`, options);
  }
  list(query = {}, options) {
    return this._client.getAPIList("/containers", CursorPage, { query, ...options });
  }
  delete(containerID, options) {
    return this._client.delete(path`/containers/${containerID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
}
Containers.Files = Files;
// node_modules/openai/resources/embeddings.mjs
class Embeddings extends APIResource {
  create(body, options) {
    const hasUserProvidedEncodingFormat = !!body.encoding_format;
    let encoding_format = hasUserProvidedEncodingFormat ? body.encoding_format : "base64";
    if (hasUserProvidedEncodingFormat) {
      loggerFor(this._client).debug("embeddings/user defined encoding_format:", body.encoding_format);
    }
    const response = this._client.post("/embeddings", {
      body: {
        ...body,
        encoding_format
      },
      ...options
    });
    if (hasUserProvidedEncodingFormat) {
      return response;
    }
    loggerFor(this._client).debug("embeddings/decoding base64 embeddings from base64");
    return response._thenUnwrap((response2) => {
      if (response2 && response2.data) {
        response2.data.forEach((embeddingBase64Obj) => {
          const embeddingBase64Str = embeddingBase64Obj.embedding;
          embeddingBase64Obj.embedding = toFloat32Array(embeddingBase64Str);
        });
      }
      return response2;
    });
  }
}
// node_modules/openai/resources/evals/runs/output-items.mjs
class OutputItems extends APIResource {
  retrieve(outputItemID, params, options) {
    const { eval_id, run_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${run_id}/output_items/${outputItemID}`, options);
  }
  list(runID, params, options) {
    const { eval_id, ...query } = params;
    return this._client.getAPIList(path`/evals/${eval_id}/runs/${runID}/output_items`, CursorPage, { query, ...options });
  }
}

// node_modules/openai/resources/evals/runs/runs.mjs
class Runs2 extends APIResource {
  constructor() {
    super(...arguments);
    this.outputItems = new OutputItems(this._client);
  }
  create(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}/runs`, { body, ...options });
  }
  retrieve(runID, params, options) {
    const { eval_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  list(evalID, query = {}, options) {
    return this._client.getAPIList(path`/evals/${evalID}/runs`, CursorPage, {
      query,
      ...options
    });
  }
  delete(runID, params, options) {
    const { eval_id } = params;
    return this._client.delete(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  cancel(runID, params, options) {
    const { eval_id } = params;
    return this._client.post(path`/evals/${eval_id}/runs/${runID}`, options);
  }
}
Runs2.OutputItems = OutputItems;

// node_modules/openai/resources/evals/evals.mjs
class Evals extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs2(this._client);
  }
  create(body, options) {
    return this._client.post("/evals", { body, ...options });
  }
  retrieve(evalID, options) {
    return this._client.get(path`/evals/${evalID}`, options);
  }
  update(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}`, { body, ...options });
  }
  list(query = {}, options) {
    return this._client.getAPIList("/evals", CursorPage, { query, ...options });
  }
  delete(evalID, options) {
    return this._client.delete(path`/evals/${evalID}`, options);
  }
}
Evals.Runs = Runs2;
// node_modules/openai/resources/files.mjs
class Files2 extends APIResource {
  create(body, options) {
    return this._client.post("/files", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  retrieve(fileID, options) {
    return this._client.get(path`/files/${fileID}`, options);
  }
  list(query = {}, options) {
    return this._client.getAPIList("/files", CursorPage, { query, ...options });
  }
  delete(fileID, options) {
    return this._client.delete(path`/files/${fileID}`, options);
  }
  content(fileID, options) {
    return this._client.get(path`/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
  async waitForProcessing(id, { pollInterval = 5000, maxWait = 30 * 60 * 1000 } = {}) {
    const TERMINAL_STATES = new Set(["processed", "error", "deleted"]);
    const start = Date.now();
    let file = await this.retrieve(id);
    while (!file.status || !TERMINAL_STATES.has(file.status)) {
      await sleep(pollInterval);
      file = await this.retrieve(id);
      if (Date.now() - start > maxWait) {
        throw new APIConnectionTimeoutError({
          message: `Giving up on waiting for file ${id} to finish processing after ${maxWait} milliseconds.`
        });
      }
    }
    return file;
  }
}
// node_modules/openai/resources/fine-tuning/methods.mjs
class Methods extends APIResource {
}

// node_modules/openai/resources/fine-tuning/alpha/graders.mjs
class Graders extends APIResource {
  run(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/run", { body, ...options });
  }
  validate(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/validate", { body, ...options });
  }
}

// node_modules/openai/resources/fine-tuning/alpha/alpha.mjs
class Alpha extends APIResource {
  constructor() {
    super(...arguments);
    this.graders = new Graders(this._client);
  }
}
Alpha.Graders = Graders;

// node_modules/openai/resources/fine-tuning/checkpoints/permissions.mjs
class Permissions extends APIResource {
  create(fineTunedModelCheckpoint, body, options) {
    return this._client.getAPIList(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, Page, { body, method: "post", ...options });
  }
  retrieve(fineTunedModelCheckpoint, query = {}, options) {
    return this._client.get(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, {
      query,
      ...options
    });
  }
  delete(permissionID, params, options) {
    const { fine_tuned_model_checkpoint } = params;
    return this._client.delete(path`/fine_tuning/checkpoints/${fine_tuned_model_checkpoint}/permissions/${permissionID}`, options);
  }
}

// node_modules/openai/resources/fine-tuning/checkpoints/checkpoints.mjs
class Checkpoints extends APIResource {
  constructor() {
    super(...arguments);
    this.permissions = new Permissions(this._client);
  }
}
Checkpoints.Permissions = Permissions;

// node_modules/openai/resources/fine-tuning/jobs/checkpoints.mjs
class Checkpoints2 extends APIResource {
  list(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/checkpoints`, CursorPage, { query, ...options });
  }
}

// node_modules/openai/resources/fine-tuning/jobs/jobs.mjs
class Jobs extends APIResource {
  constructor() {
    super(...arguments);
    this.checkpoints = new Checkpoints2(this._client);
  }
  create(body, options) {
    return this._client.post("/fine_tuning/jobs", { body, ...options });
  }
  retrieve(fineTuningJobID, options) {
    return this._client.get(path`/fine_tuning/jobs/${fineTuningJobID}`, options);
  }
  list(query = {}, options) {
    return this._client.getAPIList("/fine_tuning/jobs", CursorPage, { query, ...options });
  }
  cancel(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/cancel`, options);
  }
  listEvents(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/events`, CursorPage, { query, ...options });
  }
  pause(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/pause`, options);
  }
  resume(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/resume`, options);
  }
}
Jobs.Checkpoints = Checkpoints2;

// node_modules/openai/resources/fine-tuning/fine-tuning.mjs
class FineTuning extends APIResource {
  constructor() {
    super(...arguments);
    this.methods = new Methods(this._client);
    this.jobs = new Jobs(this._client);
    this.checkpoints = new Checkpoints(this._client);
    this.alpha = new Alpha(this._client);
  }
}
FineTuning.Methods = Methods;
FineTuning.Jobs = Jobs;
FineTuning.Checkpoints = Checkpoints;
FineTuning.Alpha = Alpha;
// node_modules/openai/resources/graders/grader-models.mjs
class GraderModels extends APIResource {
}

// node_modules/openai/resources/graders/graders.mjs
class Graders2 extends APIResource {
  constructor() {
    super(...arguments);
    this.graderModels = new GraderModels(this._client);
  }
}
Graders2.GraderModels = GraderModels;
// node_modules/openai/resources/images.mjs
class Images extends APIResource {
  createVariation(body, options) {
    return this._client.post("/images/variations", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  edit(body, options) {
    return this._client.post("/images/edits", multipartFormRequestOptions({ body, ...options, stream: body.stream ?? false }, this._client));
  }
  generate(body, options) {
    return this._client.post("/images/generations", { body, ...options, stream: body.stream ?? false });
  }
}
// node_modules/openai/resources/models.mjs
class Models extends APIResource {
  retrieve(model, options) {
    return this._client.get(path`/models/${model}`, options);
  }
  list(options) {
    return this._client.getAPIList("/models", Page, options);
  }
  delete(model, options) {
    return this._client.delete(path`/models/${model}`, options);
  }
}
// node_modules/openai/resources/moderations.mjs
class Moderations extends APIResource {
  create(body, options) {
    return this._client.post("/moderations", { body, ...options });
  }
}
// node_modules/openai/lib/ResponsesParser.mjs
function maybeParseResponse(response, params) {
  if (!params || !hasAutoParseableInput2(params)) {
    return {
      ...response,
      output_parsed: null,
      output: response.output.map((item) => {
        if (item.type === "function_call") {
          return {
            ...item,
            parsed_arguments: null
          };
        }
        if (item.type === "message") {
          return {
            ...item,
            content: item.content.map((content) => ({
              ...content,
              parsed: null
            }))
          };
        } else {
          return item;
        }
      })
    };
  }
  return parseResponse(response, params);
}
function parseResponse(response, params) {
  const output = response.output.map((item) => {
    if (item.type === "function_call") {
      return {
        ...item,
        parsed_arguments: parseToolCall2(params, item)
      };
    }
    if (item.type === "message") {
      const content = item.content.map((content2) => {
        if (content2.type === "output_text") {
          return {
            ...content2,
            parsed: parseTextFormat(params, content2.text)
          };
        }
        return content2;
      });
      return {
        ...item,
        content
      };
    }
    return item;
  });
  const parsed = Object.assign({}, response, { output });
  if (!Object.getOwnPropertyDescriptor(response, "output_text")) {
    addOutputText(parsed);
  }
  Object.defineProperty(parsed, "output_parsed", {
    enumerable: true,
    get() {
      for (const output2 of parsed.output) {
        if (output2.type !== "message") {
          continue;
        }
        for (const content of output2.content) {
          if (content.type === "output_text" && content.parsed !== null) {
            return content.parsed;
          }
        }
      }
      return null;
    }
  });
  return parsed;
}
function parseTextFormat(params, content) {
  if (params.text?.format?.type !== "json_schema") {
    return null;
  }
  if ("$parseRaw" in params.text?.format) {
    const text_format = params.text?.format;
    return text_format.$parseRaw(content);
  }
  return JSON.parse(content);
}
function hasAutoParseableInput2(params) {
  if (isAutoParsableResponseFormat(params.text?.format)) {
    return true;
  }
  return false;
}
function isAutoParsableTool2(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function getInputToolByName(input_tools, name) {
  return input_tools.find((tool) => tool.type === "function" && tool.name === name);
}
function parseToolCall2(params, toolCall) {
  const inputTool = getInputToolByName(params.tools ?? [], toolCall.name);
  return {
    ...toolCall,
    ...toolCall,
    parsed_arguments: isAutoParsableTool2(inputTool) ? inputTool.$parseRaw(toolCall.arguments) : inputTool?.strict ? JSON.parse(toolCall.arguments) : null
  };
}
function addOutputText(rsp) {
  const texts = [];
  for (const output of rsp.output) {
    if (output.type !== "message") {
      continue;
    }
    for (const content of output.content) {
      if (content.type === "output_text") {
        texts.push(content.text);
      }
    }
  }
  rsp.output_text = texts.join("");
}

// node_modules/openai/lib/responses/ResponseStream.mjs
var _ResponseStream_instances;
var _ResponseStream_params;
var _ResponseStream_currentResponseSnapshot;
var _ResponseStream_finalResponse;
var _ResponseStream_beginRequest;
var _ResponseStream_addEvent;
var _ResponseStream_endRequest;
var _ResponseStream_accumulateResponse;

class ResponseStream extends EventStream {
  constructor(params) {
    super();
    _ResponseStream_instances.add(this);
    _ResponseStream_params.set(this, undefined);
    _ResponseStream_currentResponseSnapshot.set(this, undefined);
    _ResponseStream_finalResponse.set(this, undefined);
    __classPrivateFieldSet(this, _ResponseStream_params, params, "f");
  }
  static createResponse(client, params, options) {
    const runner = new ResponseStream(params);
    runner._run(() => runner._createOrRetrieveResponse(client, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createOrRetrieveResponse(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_beginRequest).call(this);
    let stream;
    let starting_after = null;
    if ("response_id" in params) {
      stream = await client.responses.retrieve(params.response_id, { stream: true }, { ...options, signal: this.controller.signal, stream: true });
      starting_after = params.starting_after ?? null;
    } else {
      stream = await client.responses.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    }
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_addEvent).call(this, event, starting_after);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_endRequest).call(this);
  }
  [(_ResponseStream_params = new WeakMap, _ResponseStream_currentResponseSnapshot = new WeakMap, _ResponseStream_finalResponse = new WeakMap, _ResponseStream_instances = new WeakSet, _ResponseStream_beginRequest = function _ResponseStream_beginRequest() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, undefined, "f");
  }, _ResponseStream_addEvent = function _ResponseStream_addEvent(event, starting_after) {
    if (this.ended)
      return;
    const maybeEmit = (name, event2) => {
      if (starting_after == null || event2.sequence_number > starting_after) {
        this._emit(name, event2);
      }
    };
    const response = __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_accumulateResponse).call(this, event);
    maybeEmit("event", event);
    switch (event.type) {
      case "response.output_text.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          maybeEmit("response.output_text.delta", {
            ...event,
            snapshot: content.text
          });
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          maybeEmit("response.function_call_arguments.delta", {
            ...event,
            snapshot: output.arguments
          });
        }
        break;
      }
      default:
        maybeEmit(event.type, event);
        break;
    }
  }, _ResponseStream_endRequest = function _ResponseStream_endRequest() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any events`);
    }
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, undefined, "f");
    const parsedResponse = finalizeResponse(snapshot, __classPrivateFieldGet(this, _ResponseStream_params, "f"));
    __classPrivateFieldSet(this, _ResponseStream_finalResponse, parsedResponse, "f");
    return parsedResponse;
  }, _ResponseStream_accumulateResponse = function _ResponseStream_accumulateResponse(event) {
    let snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      if (event.type !== "response.created") {
        throw new OpenAIError(`When snapshot hasn't been set yet, expected 'response.created' event, got ${event.type}`);
      }
      snapshot = __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
      return snapshot;
    }
    switch (event.type) {
      case "response.output_item.added": {
        snapshot.output.push(event.item);
        break;
      }
      case "response.content_part.added": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          output.content.push(event.part);
        }
        break;
      }
      case "response.output_text.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          content.text += event.delta;
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          output.arguments += event.delta;
        }
        break;
      }
      case "response.completed": {
        __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
        break;
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(undefined);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: undefined, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((event2) => event2 ? { value: event2, done: false } : { value: undefined, done: true });
        }
        const event = pushQueue.shift();
        return { value: event, done: false };
      },
      return: async () => {
        this.abort();
        return { value: undefined, done: true };
      }
    };
  }
  async finalResponse() {
    await this.done();
    const response = __classPrivateFieldGet(this, _ResponseStream_finalResponse, "f");
    if (!response)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return response;
  }
}
function finalizeResponse(snapshot, params) {
  return maybeParseResponse(snapshot, params);
}

// node_modules/openai/resources/responses/input-items.mjs
class InputItems extends APIResource {
  list(responseID, query = {}, options) {
    return this._client.getAPIList(path`/responses/${responseID}/input_items`, CursorPage, { query, ...options });
  }
}

// node_modules/openai/resources/responses/responses.mjs
class Responses extends APIResource {
  constructor() {
    super(...arguments);
    this.inputItems = new InputItems(this._client);
  }
  create(body, options) {
    return this._client.post("/responses", { body, ...options, stream: body.stream ?? false })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  retrieve(responseID, query = {}, options) {
    return this._client.get(path`/responses/${responseID}`, {
      query,
      ...options,
      stream: query?.stream ?? false
    })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  delete(responseID, options) {
    return this._client.delete(path`/responses/${responseID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  parse(body, options) {
    return this._client.responses.create(body, options)._thenUnwrap((response) => parseResponse(response, body));
  }
  stream(body, options) {
    return ResponseStream.createResponse(this._client, body, options);
  }
  cancel(responseID, options) {
    return this._client.post(path`/responses/${responseID}/cancel`, options);
  }
}
Responses.InputItems = InputItems;
// node_modules/openai/resources/uploads/parts.mjs
class Parts extends APIResource {
  create(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/parts`, multipartFormRequestOptions({ body, ...options }, this._client));
  }
}

// node_modules/openai/resources/uploads/uploads.mjs
class Uploads extends APIResource {
  constructor() {
    super(...arguments);
    this.parts = new Parts(this._client);
  }
  create(body, options) {
    return this._client.post("/uploads", { body, ...options });
  }
  cancel(uploadID, options) {
    return this._client.post(path`/uploads/${uploadID}/cancel`, options);
  }
  complete(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/complete`, { body, ...options });
  }
}
Uploads.Parts = Parts;
// node_modules/openai/lib/Util.mjs
var allSettledWithThrow = async (promises) => {
  const results = await Promise.allSettled(promises);
  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length) {
    for (const result of rejected) {
      console.error(result.reason);
    }
    throw new Error(`${rejected.length} promise(s) failed - see the above errors`);
  }
  const values2 = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      values2.push(result.value);
    }
  }
  return values2;
};

// node_modules/openai/resources/vector-stores/file-batches.mjs
class FileBatches extends APIResource {
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/file_batches`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/file_batches/${batchID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  cancel(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  async createAndPoll(vectorStoreId, body, options) {
    const batch = await this.create(vectorStoreId, body);
    return await this.poll(vectorStoreId, batch.id, options);
  }
  listFiles(batchID, params, options) {
    const { vector_store_id, ...query } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/files`, CursorPage, { query, ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
  async poll(vectorStoreID, batchID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? undefined
      }
    ]);
    while (true) {
      const { data: batch, response } = await this.retrieve(batchID, { vector_store_id: vectorStoreID }, {
        ...options,
        headers
      }).withResponse();
      switch (batch.status) {
        case "in_progress":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return batch;
      }
    }
  }
  async uploadAndPoll(vectorStoreId, { files, fileIds = [] }, options) {
    if (files == null || files.length == 0) {
      throw new Error(`No \`files\` provided to process. If you've already uploaded files you should use \`.createAndPoll()\` instead`);
    }
    const configuredConcurrency = options?.maxConcurrency ?? 5;
    const concurrencyLimit = Math.min(configuredConcurrency, files.length);
    const client = this._client;
    const fileIterator = files.values();
    const allFileIds = [...fileIds];
    async function processFiles(iterator) {
      for (let item of iterator) {
        const fileObj = await client.files.create({ file: item, purpose: "assistants" }, options);
        allFileIds.push(fileObj.id);
      }
    }
    const workers = Array(concurrencyLimit).fill(fileIterator).map(processFiles);
    await allSettledWithThrow(workers);
    return await this.createAndPoll(vectorStoreId, {
      file_ids: allFileIds
    });
  }
}

// node_modules/openai/resources/vector-stores/files.mjs
class Files3 extends APIResource {
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/files`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(fileID, params, options) {
    const { vector_store_id, ...body } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(vectorStoreID, query = {}, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/files`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  delete(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.delete(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  async createAndPoll(vectorStoreId, body, options) {
    const file = await this.create(vectorStoreId, body, options);
    return await this.poll(vectorStoreId, file.id, options);
  }
  async poll(vectorStoreID, fileID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? undefined
      }
    ]);
    while (true) {
      const fileResponse = await this.retrieve(fileID, {
        vector_store_id: vectorStoreID
      }, { ...options, headers }).withResponse();
      const file = fileResponse.data;
      switch (file.status) {
        case "in_progress":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = fileResponse.response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "completed":
          return file;
      }
    }
  }
  async upload(vectorStoreId, file, options) {
    const fileInfo = await this._client.files.create({ file, purpose: "assistants" }, options);
    return this.create(vectorStoreId, { file_id: fileInfo.id }, options);
  }
  async uploadAndPoll(vectorStoreId, file, options) {
    const fileInfo = await this.upload(vectorStoreId, file, options);
    return await this.poll(vectorStoreId, fileInfo.id, options);
  }
  content(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/files/${fileID}/content`, Page, { ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
}

// node_modules/openai/resources/vector-stores/vector-stores.mjs
class VectorStores extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files3(this._client);
    this.fileBatches = new FileBatches(this._client);
  }
  create(body, options) {
    return this._client.post("/vector_stores", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  retrieve(vectorStoreID, options) {
    return this._client.get(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  update(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  list(query = {}, options) {
    return this._client.getAPIList("/vector_stores", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  delete(vectorStoreID, options) {
    return this._client.delete(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  search(vectorStoreID, body, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/search`, Page, {
      body,
      method: "post",
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
}
VectorStores.Files = Files3;
VectorStores.FileBatches = FileBatches;
// node_modules/openai/resources/webhooks.mjs
var _Webhooks_instances;
var _Webhooks_validateSecret;
var _Webhooks_getRequiredHeader;

class Webhooks extends APIResource {
  constructor() {
    super(...arguments);
    _Webhooks_instances.add(this);
  }
  async unwrap(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    await this.verifySignature(payload, headers, secret, tolerance);
    return JSON.parse(payload);
  }
  async verifySignature(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    if (typeof crypto === "undefined" || typeof crypto.subtle.importKey !== "function" || typeof crypto.subtle.verify !== "function") {
      throw new Error("Webhook signature verification is only supported when the `crypto` global is defined");
    }
    __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_validateSecret).call(this, secret);
    const headersObj = buildHeaders([headers]).values;
    const signatureHeader = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-signature");
    const timestamp = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-timestamp");
    const webhookId = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-id");
    const timestampSeconds = parseInt(timestamp, 10);
    if (isNaN(timestampSeconds)) {
      throw new InvalidWebhookSignatureError("Invalid webhook timestamp format");
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - timestampSeconds > tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too old");
    }
    if (timestampSeconds > nowSeconds + tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too new");
    }
    const signatures = signatureHeader.split(" ").map((part) => part.startsWith("v1,") ? part.substring(3) : part);
    const decodedSecret = secret.startsWith("whsec_") ? Buffer.from(secret.replace("whsec_", ""), "base64") : Buffer.from(secret, "utf-8");
    const signedPayload = webhookId ? `${webhookId}.${timestamp}.${payload}` : `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey("raw", decodedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    for (const signature of signatures) {
      try {
        const signatureBytes = Buffer.from(signature, "base64");
        const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(signedPayload));
        if (isValid) {
          return;
        }
      } catch {
        continue;
      }
    }
    throw new InvalidWebhookSignatureError("The given webhook signature does not match the expected signature");
  }
}
_Webhooks_instances = new WeakSet, _Webhooks_validateSecret = function _Webhooks_validateSecret2(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error(`The webhook secret must either be set using the env var, OPENAI_WEBHOOK_SECRET, on the client class, OpenAI({ webhookSecret: '123' }), or passed to this function`);
  }
}, _Webhooks_getRequiredHeader = function _Webhooks_getRequiredHeader2(headers, name) {
  if (!headers) {
    throw new Error(`Headers are required`);
  }
  const value = headers.get(name);
  if (value === null || value === undefined) {
    throw new Error(`Missing required header: ${name}`);
  }
  return value;
};
// node_modules/openai/client.mjs
var _OpenAI_instances;
var _a2;
var _OpenAI_encoder;
var _OpenAI_baseURLOverridden;

class OpenAI {
  constructor({ baseURL = readEnv("OPENAI_BASE_URL"), apiKey = readEnv("OPENAI_API_KEY"), organization = readEnv("OPENAI_ORG_ID") ?? null, project = readEnv("OPENAI_PROJECT_ID") ?? null, webhookSecret = readEnv("OPENAI_WEBHOOK_SECRET") ?? null, ...opts } = {}) {
    _OpenAI_instances.add(this);
    _OpenAI_encoder.set(this, undefined);
    this.completions = new Completions2(this);
    this.chat = new Chat(this);
    this.embeddings = new Embeddings(this);
    this.files = new Files2(this);
    this.images = new Images(this);
    this.audio = new Audio(this);
    this.moderations = new Moderations(this);
    this.models = new Models(this);
    this.fineTuning = new FineTuning(this);
    this.graders = new Graders2(this);
    this.vectorStores = new VectorStores(this);
    this.webhooks = new Webhooks(this);
    this.beta = new Beta(this);
    this.batches = new Batches(this);
    this.uploads = new Uploads(this);
    this.responses = new Responses(this);
    this.evals = new Evals(this);
    this.containers = new Containers(this);
    if (apiKey === undefined) {
      throw new OpenAIError("The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).");
    }
    const options = {
      apiKey,
      organization,
      project,
      webhookSecret,
      ...opts,
      baseURL: baseURL || `https://api.openai.com/v1`
    };
    if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new OpenAIError(`It looks like you're running in a browser-like environment.

This is disabled by default, as it risks exposing your secret API credentials to attackers.
If you understand the risks and have appropriate mitigations in place,
you can set the \`dangerouslyAllowBrowser\` option to \`true\`, e.g.,

new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
`);
    }
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? _a2.DEFAULT_TIMEOUT;
    this.logger = options.logger ?? console;
    const defaultLogLevel = "warn";
    this.logLevel = defaultLogLevel;
    this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("OPENAI_LOG"), "process.env['OPENAI_LOG']", this) ?? defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? getDefaultFetch();
    __classPrivateFieldSet(this, _OpenAI_encoder, FallbackEncoder, "f");
    this._options = options;
    this.apiKey = apiKey;
    this.organization = organization;
    this.project = project;
    this.webhookSecret = webhookSecret;
  }
  withOptions(options) {
    const client = new this.constructor({
      ...this._options,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      apiKey: this.apiKey,
      organization: this.organization,
      project: this.project,
      webhookSecret: this.webhookSecret,
      ...options
    });
    return client;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  validateHeaders({ values: values2, nulls }) {
    return;
  }
  async authHeaders(opts) {
    return buildHeaders([{ Authorization: `Bearer ${this.apiKey}` }]);
  }
  stringifyQuery(query) {
    return stringify(query, { arrayFormat: "brackets" });
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  makeStatusError(status, error2, message, headers) {
    return APIError.generate(status, error2, message, headers);
  }
  buildURL(path2, query, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet(this, _OpenAI_instances, "m", _OpenAI_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path2) ? new URL(path2) : new URL(baseURL + (baseURL.endsWith("/") && path2.startsWith("/") ? path2.slice(1) : path2));
    const defaultQuery = this.defaultQuery();
    if (!isEmptyObj(defaultQuery)) {
      query = { ...defaultQuery, ...query };
    }
    if (typeof query === "object" && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query);
    }
    return url.toString();
  }
  async prepareOptions(options) {}
  async prepareRequest(request, { url, options }) {}
  get(path2, opts) {
    return this.methodRequest("get", path2, opts);
  }
  post(path2, opts) {
    return this.methodRequest("post", path2, opts);
  }
  patch(path2, opts) {
    return this.methodRequest("patch", path2, opts);
  }
  put(path2, opts) {
    return this.methodRequest("put", path2, opts);
  }
  delete(path2, opts) {
    return this.methodRequest("delete", path2, opts);
  }
  methodRequest(method, path2, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path2, ...opts2 };
    }));
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, undefined));
  }
  async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining
    });
    await this.prepareRequest(req, { url, options });
    const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
    const retryLogStr = retryOfRequestLogID === undefined ? "" : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();
    loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
      retryOfRequestLogID,
      method: options.method,
      url,
      options,
      headers: req.headers
    }));
    if (options.signal?.aborted) {
      throw new APIUserAbortError;
    }
    const controller = new AbortController;
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();
    if (response instanceof Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new APIUserAbortError;
      }
      const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
      if (retriesRemaining) {
        loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
        loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
      loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
        retryOfRequestLogID,
        url,
        durationMs: headersTime - startTime,
        message: response.message
      }));
      if (isTimeout) {
        throw new APIConnectionTimeoutError;
      }
      throw new APIConnectionError({ cause: response });
    }
    const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "x-request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
    const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
    if (!response.ok) {
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        await CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
        loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
      }
      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err2) => castToError(err2).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? undefined : errText;
      loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        message: errMessage,
        durationMs: Date.now() - startTime
      }));
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }
    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
      retryOfRequestLogID,
      url: response.url,
      status: response.status,
      headers: response.headers,
      durationMs: headersTime - startTime
    }));
    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }
  getAPIList(path2, Page2, opts) {
    return this.requestAPIList(Page2, { method: "get", path: path2, ...opts });
  }
  requestAPIList(Page2, options) {
    const request = this.makeRequest(options, null, undefined);
    return new PagePromise(this, request, Page2);
  }
  async fetchWithTimeout(url, init, ms, controller) {
    const { signal, method, ...options } = init || {};
    if (signal)
      signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
    const fetchOptions = {
      signal: controller.signal,
      ...isReadableBody ? { duplex: "half" } : {},
      method: "GET",
      ...options
    };
    if (method) {
      fetchOptions.method = method.toUpperCase();
    }
    try {
      return await this.fetch.call(undefined, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }
  async shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.get("retry-after");
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1000;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (!(timeoutMillis && 0 <= timeoutMillis && timeoutMillis < 60 * 1000)) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1000;
  }
  async buildRequest(inputOptions, { retryCount = 0 } = {}) {
    const options = { ...inputOptions };
    const { method, path: path2, query, defaultBaseURL } = options;
    const url = this.buildURL(path2, query, defaultBaseURL);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
    const req = {
      method,
      headers: reqHeaders,
      ...options.signal && { signal: options.signal },
      ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
      ...body && { body },
      ...this.fetchOptions ?? {},
      ...options.fetchOptions ?? {}
    };
    return { req, url, timeout: options.timeout };
  }
  async buildHeaders({ options, method, bodyHeaders, retryCount }) {
    let idempotencyHeaders = {};
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }
    const headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: "application/json",
        "User-Agent": this.getUserAgent(),
        "X-Stainless-Retry-Count": String(retryCount),
        ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1000)) } : {},
        ...getPlatformHeaders(),
        "OpenAI-Organization": this.organization,
        "OpenAI-Project": this.project
      },
      await this.authHeaders(options),
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers
    ]);
    this.validateHeaders(headers);
    return headers.values;
  }
  buildBody({ options: { body, headers: rawHeaders } }) {
    if (!body) {
      return { bodyHeaders: undefined, body: undefined };
    }
    const headers = buildHeaders([rawHeaders]);
    if (ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && headers.values.has("content-type") || body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams || globalThis.ReadableStream && body instanceof globalThis.ReadableStream) {
      return { bodyHeaders: undefined, body };
    } else if (typeof body === "object" && ((Symbol.asyncIterator in body) || (Symbol.iterator in body) && ("next" in body) && typeof body.next === "function")) {
      return { bodyHeaders: undefined, body: ReadableStreamFrom(body) };
    } else {
      return __classPrivateFieldGet(this, _OpenAI_encoder, "f").call(this, { body, headers });
    }
  }
}
_a2 = OpenAI, _OpenAI_encoder = new WeakMap, _OpenAI_instances = new WeakSet, _OpenAI_baseURLOverridden = function _OpenAI_baseURLOverridden2() {
  return this.baseURL !== "https://api.openai.com/v1";
};
OpenAI.OpenAI = _a2;
OpenAI.DEFAULT_TIMEOUT = 600000;
OpenAI.OpenAIError = OpenAIError;
OpenAI.APIError = APIError;
OpenAI.APIConnectionError = APIConnectionError;
OpenAI.APIConnectionTimeoutError = APIConnectionTimeoutError;
OpenAI.APIUserAbortError = APIUserAbortError;
OpenAI.NotFoundError = NotFoundError;
OpenAI.ConflictError = ConflictError;
OpenAI.RateLimitError = RateLimitError;
OpenAI.BadRequestError = BadRequestError;
OpenAI.AuthenticationError = AuthenticationError;
OpenAI.InternalServerError = InternalServerError;
OpenAI.PermissionDeniedError = PermissionDeniedError;
OpenAI.UnprocessableEntityError = UnprocessableEntityError;
OpenAI.InvalidWebhookSignatureError = InvalidWebhookSignatureError;
OpenAI.toFile = toFile;
OpenAI.Completions = Completions2;
OpenAI.Chat = Chat;
OpenAI.Embeddings = Embeddings;
OpenAI.Files = Files2;
OpenAI.Images = Images;
OpenAI.Audio = Audio;
OpenAI.Moderations = Moderations;
OpenAI.Models = Models;
OpenAI.FineTuning = FineTuning;
OpenAI.Graders = Graders2;
OpenAI.VectorStores = VectorStores;
OpenAI.Webhooks = Webhooks;
OpenAI.Beta = Beta;
OpenAI.Batches = Batches;
OpenAI.Uploads = Uploads;
OpenAI.Responses = Responses;
OpenAI.Evals = Evals;
OpenAI.Containers = Containers;
// node_modules/openai/azure.mjs
var _deployments_endpoints = new Set([
  "/completions",
  "/chat/completions",
  "/embeddings",
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech",
  "/images/generations",
  "/batches",
  "/images/edits"
]);
// node_modules/marked/lib/marked.esm.js
function L() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var O = L();
function H(l) {
  O = l;
}
var E = { exec: () => null };
function h(l, e = "") {
  let t = typeof l == "string" ? l : l.source, n = { replace: (r, i) => {
    let s = typeof i == "string" ? i : i.source;
    return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] /, listReplaceTask: /^\[[ xX]\] +/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l) => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}#`), htmlBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}<(?:[a-z].*>|!--)`, "i") };
var xe = /^(?:[ \t]*(?:\n|$))+/;
var be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var C = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Oe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var j = /(?:[*+-]|\d{1,9}[.)])/;
var se = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var ie = h(se).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Te = h(se).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var we = /^[^\n]+/;
var Q = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
var ye = h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Q).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var Pe = h(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, j).getRegex();
var v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var U = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Se = h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", U).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var oe = h(F).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
var $e = h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", oe).getRegex();
var K = { blockquote: $e, code: be, def: ye, fences: Re, heading: Oe, hr: C, html: Se, lheading: ie, list: Pe, newline: xe, paragraph: oe, table: E, text: we };
var re = h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
var _e = { ...K, lheading: Te, table: re, paragraph: h(F).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", re).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex() };
var Le = { ...K, html: h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", U).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: E, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: h(F).replace("hr", C).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ie).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var ae = /^( {2,}|\\)\n(?!\s*$)/;
var Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var D = /[\p{P}\p{S}]/u;
var W = /[\s\p{P}\p{S}]/u;
var le = /[^\s\p{P}\p{S}]/u;
var Ee = h(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, W).getRegex();
var ue = /(?!~)[\p{P}\p{S}]/u;
var Ce = /(?!~)[\s\p{P}\p{S}]/u;
var Ie = /(?:[^\s\p{P}\p{S}]|~)/u;
var Be = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g;
var pe = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
var qe = h(pe, "u").replace(/punct/g, D).getRegex();
var ve = h(pe, "u").replace(/punct/g, ue).getRegex();
var ce = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var De = h(ce, "gu").replace(/notPunctSpace/g, le).replace(/punctSpace/g, W).replace(/punct/g, D).getRegex();
var Ze = h(ce, "gu").replace(/notPunctSpace/g, Ie).replace(/punctSpace/g, Ce).replace(/punct/g, ue).getRegex();
var Ge = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, le).replace(/punctSpace/g, W).replace(/punct/g, D).getRegex();
var He = h(/\\(punct)/, "gu").replace(/punct/g, D).getRegex();
var Ne = h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var je = h(U).replace("(?:-->|$)", "-->").getRegex();
var Fe = h("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", je).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var q = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
var Qe = h(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var he = h(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", Q).getRegex();
var de = h(/^!?\[(ref)\](?:\[\])?/).replace("ref", Q).getRegex();
var Ue = h("reflink|nolink(?!\\()", "g").replace("reflink", he).replace("nolink", de).getRegex();
var X = { _backpedal: E, anyPunctuation: He, autolink: Ne, blockSkip: Be, br: ae, code: ze, del: E, emStrongLDelim: qe, emStrongRDelimAst: De, emStrongRDelimUnd: Ge, escape: Me, link: Qe, nolink: de, punctuation: Ee, reflink: he, reflinkSearch: Ue, tag: Fe, text: Ae, url: E };
var Ke = { ...X, link: h(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(), reflink: h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex() };
var N = { ...X, emStrongRDelimAst: Ze, emStrongLDelim: ve, url: h(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ };
var We = { ...N, br: h(ae).replace("{2,}", "*").getRegex(), text: h(N.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var I = { normal: K, gfm: _e, pedantic: Le };
var M = { normal: X, gfm: N, breaks: We, pedantic: Ke };
var Xe = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ke = (l) => Xe[l];
function w(l, e) {
  if (e) {
    if (m.escapeTest.test(l))
      return l.replace(m.escapeReplace, ke);
  } else if (m.escapeTestNoEncode.test(l))
    return l.replace(m.escapeReplaceNoEncode, ke);
  return l;
}
function J(l) {
  try {
    l = encodeURI(l).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return l;
}
function V(l, e) {
  let t = l.replace(m.findPipe, (i, s, o) => {
    let a = false, u = s;
    for (;--u >= 0 && o[u] === "\\"; )
      a = !a;
    return a ? "|" : " |";
  }), n = t.split(m.splitPipe), r = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e)
    if (n.length > e)
      n.splice(e);
    else
      for (;n.length < e; )
        n.push("");
  for (;r < n.length; r++)
    n[r] = n[r].trim().replace(m.slashPipe, "|");
  return n;
}
function z(l, e, t) {
  let n = l.length;
  if (n === 0)
    return "";
  let r = 0;
  for (;r < n; ) {
    let i = l.charAt(n - r - 1);
    if (i === e && !t)
      r++;
    else if (i !== e && t)
      r++;
    else
      break;
  }
  return l.slice(0, n - r);
}
function ge(l, e) {
  if (l.indexOf(e[1]) === -1)
    return -1;
  let t = 0;
  for (let n = 0;n < l.length; n++)
    if (l[n] === "\\")
      n++;
    else if (l[n] === e[0])
      t++;
    else if (l[n] === e[1] && (t--, t < 0))
      return n;
  return t > 0 ? -2 : -1;
}
function fe(l, e, t, n, r) {
  let i = e.href, s = e.title || null, o = l[1].replace(r.other.outputLinkReplace, "$1");
  n.state.inLink = true;
  let a = { type: l[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i, title: s, text: o, tokens: n.inlineTokens(o) };
  return n.state.inLink = false, a;
}
function Je(l, e, t) {
  let n = l.match(t.other.indentCodeCompensation);
  if (n === null)
    return e;
  let r = n[1];
  return e.split(`
`).map((i) => {
    let s = i.match(t.other.beginningSpace);
    if (s === null)
      return i;
    let [o] = s;
    return o.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var y = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || O;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0)
      return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : z(n, `
`) };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], r = Je(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: r };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let r = z(n, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
      }
      return { type: "heading", raw: t[0], depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t)
      return { type: "hr", raw: z(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = z(t[0], `
`).split(`
`), r = "", i = "", s = [];
      for (;n.length > 0; ) {
        let o = false, a = [], u;
        for (u = 0;u < n.length; u++)
          if (this.rules.other.blockquoteStart.test(n[u]))
            a.push(n[u]), o = true;
          else if (!o)
            a.push(n[u]);
          else
            break;
        n = n.slice(u);
        let p = a.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
        let f = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(c, s, true), this.lexer.state.top = f, n.length === 0)
          break;
        let k = s.at(-1);
        if (k?.type === "code")
          break;
        if (k?.type === "blockquote") {
          let x = k, g = x.raw + `
` + n.join(`
`), T = this.blockquote(g);
          s[s.length - 1] = T, r = r.substring(0, r.length - x.raw.length) + T.raw, i = i.substring(0, i.length - x.text.length) + T.text;
          break;
        } else if (k?.type === "list") {
          let x = k, g = x.raw + `
` + n.join(`
`), T = this.list(g);
          s[s.length - 1] = T, r = r.substring(0, r.length - k.raw.length) + T.raw, i = i.substring(0, i.length - x.raw.length) + T.raw, n = g.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: r, tokens: s, text: i };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), r = n.length > 1, i = { type: "list", raw: "", ordered: r, start: r ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
      let s = this.rules.other.listItemRegex(n), o = false;
      for (;e; ) {
        let u = false, p = "", c = "";
        if (!(t = s.exec(e)) || this.rules.block.hr.test(e))
          break;
        p = t[0], e = e.substring(p.length);
        let f = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (Z) => " ".repeat(3 * Z.length)), k = e.split(`
`, 1)[0], x = !f.trim(), g = 0;
        if (this.options.pedantic ? (g = 2, c = f.trimStart()) : x ? g = t[1].length + 1 : (g = t[2].search(this.rules.other.nonSpaceChar), g = g > 4 ? 1 : g, c = f.slice(g), g += t[1].length), x && this.rules.other.blankLine.test(k) && (p += k + `
`, e = e.substring(k.length + 1), u = true), !u) {
          let Z = this.rules.other.nextBulletRegex(g), ee = this.rules.other.hrRegex(g), te = this.rules.other.fencesBeginRegex(g), ne = this.rules.other.headingBeginRegex(g), me = this.rules.other.htmlBeginRegex(g);
          for (;e; ) {
            let G = e.split(`
`, 1)[0], A;
            if (k = G, this.options.pedantic ? (k = k.replace(this.rules.other.listReplaceNesting, "  "), A = k) : A = k.replace(this.rules.other.tabCharGlobal, "    "), te.test(k) || ne.test(k) || me.test(k) || Z.test(k) || ee.test(k))
              break;
            if (A.search(this.rules.other.nonSpaceChar) >= g || !k.trim())
              c += `
` + A.slice(g);
            else {
              if (x || f.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || te.test(f) || ne.test(f) || ee.test(f))
                break;
              c += `
` + k;
            }
            !x && !k.trim() && (x = true), p += G + `
`, e = e.substring(G.length + 1), f = A.slice(g);
          }
        }
        i.loose || (o ? i.loose = true : this.rules.other.doubleBlankLine.test(p) && (o = true));
        let T = null, Y;
        this.options.gfm && (T = this.rules.other.listIsTask.exec(c), T && (Y = T[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({ type: "list_item", raw: p, task: !!T, checked: Y, loose: false, text: c, tokens: [] }), i.raw += p;
      }
      let a = i.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let u = 0;u < i.items.length; u++)
        if (this.lexer.state.top = false, i.items[u].tokens = this.lexer.blockTokens(i.items[u].text, []), !i.loose) {
          let p = i.items[u].tokens.filter((f) => f.type === "space"), c = p.length > 0 && p.some((f) => this.rules.other.anyLine.test(f.raw));
          i.loose = c;
        }
      if (i.loose)
        for (let u = 0;u < i.items.length; u++)
          i.items[u].loose = true;
      return i;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t)
      return { type: "html", block: true, raw: t[0], pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: t[0] };
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: t[0], href: r, title: i };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2]))
      return;
    let n = V(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = { type: "table", raw: t[0], header: [], align: [], rows: [] };
    if (n.length === r.length) {
      for (let o of r)
        this.rules.other.tableAlignRight.test(o) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? s.align.push("left") : s.align.push(null);
      for (let o = 0;o < n.length; o++)
        s.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: true, align: s.align[o] });
      for (let o of i)
        s.rows.push(V(o, s.header.length).map((a, u) => ({ text: a, tokens: this.lexer.inline(a), header: false, align: s.align[u] })));
      return s;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t)
      return { type: "heading", raw: t[0], depth: t[2].charAt(0) === "=" ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) };
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t)
      return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t)
      return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n))
          return;
        let s = z(n.slice(0, -1), "\\");
        if ((n.length - s.length) % 2 === 0)
          return;
      } else {
        let s = ge(t[2], "()");
        if (s === -2)
          return;
        if (s > -1) {
          let a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
          t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, a).trim(), t[3] = "";
        }
      }
      let r = t[2], i = "";
      if (this.options.pedantic) {
        let s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else
        i = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), fe(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[r.toLowerCase()];
      if (!i) {
        let s = n[0].charAt(0);
        return { type: "text", raw: s, text: s };
      }
      return fe(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric))
      return;
    if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1, o, a, u = s, p = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + s);(r = c.exec(t)) != null; ) {
        if (o = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !o)
          continue;
        if (a = [...o].length, r[3] || r[4]) {
          u += a;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + a) % 3)) {
          p += a;
          continue;
        }
        if (u -= a, u > 0)
          continue;
        a = Math.min(a, a + u + p);
        let f = [...r[0]][0].length, k = e.slice(0, s + r.index + f + a);
        if (Math.min(s, a) % 2) {
          let g = k.slice(1, -1);
          return { type: "em", raw: k, text: g, tokens: this.lexer.inlineTokens(g) };
        }
        let x = k.slice(2, -2);
        return { type: "strong", raw: k, text: x, tokens: this.lexer.inlineTokens(x) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return r && i && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t)
      return { type: "br", raw: t[0] };
  }
  del(e) {
    let t = this.rules.inline.del.exec(e);
    if (t)
      return { type: "del", raw: t[0], text: t[2], tokens: this.lexer.inlineTokens(t[2]) };
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, r;
      return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, r;
      if (t[2] === "@")
        n = t[0], r = "mailto:" + n;
      else {
        let i;
        do
          i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (i !== t[0]);
        n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: t[0], escaped: n };
    }
  }
};
var b = class l {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(e) {
    this.tokens = [], this.tokens.links = Object.create(null), this.options = e || O, this.options.tokenizer = this.options.tokenizer || new y, this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
    let t = { other: m, block: I.normal, inline: M.normal };
    this.options.pedantic ? (t.block = I.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = I.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: I, inline: M };
  }
  static lex(e, t) {
    return new l(t).lex(e);
  }
  static lexInline(e, t) {
    return new l(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0;t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));e; ) {
      let r;
      if (this.options.extensions?.block?.some((s) => (r = s.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false))
        continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        r.raw.length === 1 && s !== undefined ? s.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title });
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let s = 1 / 0, o = e.slice(1), a;
        this.options.extensions.startBlock.forEach((u) => {
          a = u.call({ lexer: this }, o), typeof a == "number" && a >= 0 && (s = Math.min(s, a));
        }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let s = t.at(-1);
        n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (e) {
        let s = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(s);
          break;
        } else
          throw new Error(s);
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    let n = e, r = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0)
        for (;(r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; )
          o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (;(r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; )
      n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (;(r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; )
      n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let i = false, s = "";
    for (;e; ) {
      i || (s = ""), i = false;
      let o;
      if (this.options.extensions?.inline?.some((u) => (o = u.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false))
        continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let u = t.at(-1);
        o.type === "text" && u?.type === "text" ? (u.raw += o.raw, u.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, s)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let a = e;
      if (this.options.extensions?.startInline) {
        let u = 1 / 0, p = e.slice(1), c;
        this.options.extensions.startInline.forEach((f) => {
          c = f.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (u = Math.min(u, c));
        }), u < 1 / 0 && u >= 0 && (a = e.substring(0, u + 1));
      }
      if (o = this.tokenizer.inlineText(a)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (s = o.raw.slice(-1)), i = true;
        let u = t.at(-1);
        u?.type === "text" ? (u.raw += o.raw, u.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let u = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(u);
          break;
        } else
          throw new Error(u);
      }
    }
    return t;
  }
};
var P = class {
  options;
  parser;
  constructor(e) {
    this.options = e || O;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let r = (t || "").match(m.notSpaceStart)?.[0], i = e.replace(m.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i : w(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let { ordered: t, start: n } = e, r = "";
    for (let o = 0;o < e.items.length; o++) {
      let a = e.items[o];
      r += this.listitem(a);
    }
    let i = t ? "ol" : "ul", s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(e) {
    let t = "";
    if (e.task) {
      let n = this.checkbox({ checked: !!e.checked });
      e.loose ? e.tokens[0]?.type === "paragraph" ? (e.tokens[0].text = n + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = n + " " + w(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = true)) : e.tokens.unshift({ type: "text", raw: n + " ", text: n + " ", escaped: true }) : t += n + " ";
    }
    return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0;i < e.header.length; i++)
      n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let r = "";
    for (let i = 0;i < e.rows.length; i++) {
      let s = e.rows[i];
      n = "";
      for (let o = 0;o < s.length; o++)
        n += this.tablecell(s[o]);
      r += this.tablerow({ text: n });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${w(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    let r = this.parser.parseInline(n), i = J(e);
    if (i === null)
      return r;
    e = i;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + w(t) + '"'), s += ">" + r + "</a>", s;
  }
  image({ href: e, title: t, text: n, tokens: r }) {
    r && (n = this.parser.parseInline(r, this.parser.textRenderer));
    let i = J(e);
    if (i === null)
      return w(n);
    e = i;
    let s = `<img src="${e}" alt="${n}"`;
    return t && (s += ` title="${w(t)}"`), s += ">", s;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : ("escaped" in e) && e.escaped ? e.text : w(e.text);
  }
};
var S = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
};
var R = class l2 {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || O, this.options.renderer = this.options.renderer || new P, this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new S;
  }
  static parse(e, t) {
    return new l2(t).parse(e);
  }
  static parseInline(e, t) {
    return new l2(t).parseInline(e);
  }
  parse(e, t = true) {
    let n = "";
    for (let r = 0;r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let o = i, a = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (a !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(o.type)) {
          n += a || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "space": {
          n += this.renderer.space(s);
          continue;
        }
        case "hr": {
          n += this.renderer.hr(s);
          continue;
        }
        case "heading": {
          n += this.renderer.heading(s);
          continue;
        }
        case "code": {
          n += this.renderer.code(s);
          continue;
        }
        case "table": {
          n += this.renderer.table(s);
          continue;
        }
        case "blockquote": {
          n += this.renderer.blockquote(s);
          continue;
        }
        case "list": {
          n += this.renderer.list(s);
          continue;
        }
        case "html": {
          n += this.renderer.html(s);
          continue;
        }
        case "paragraph": {
          n += this.renderer.paragraph(s);
          continue;
        }
        case "text": {
          let o = s, a = this.renderer.text(o);
          for (;r + 1 < e.length && e[r + 1].type === "text"; )
            o = e[++r], a += `
` + this.renderer.text(o);
          t ? n += this.renderer.paragraph({ type: "paragraph", raw: a, text: a, tokens: [{ type: "text", raw: a, text: a, escaped: true }] }) : n += a;
          continue;
        }
        default: {
          let o = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return n;
  }
  parseInline(e, t = this.renderer) {
    let n = "";
    for (let r = 0;r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (o !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += o || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "escape": {
          n += t.text(s);
          break;
        }
        case "html": {
          n += t.html(s);
          break;
        }
        case "link": {
          n += t.link(s);
          break;
        }
        case "image": {
          n += t.image(s);
          break;
        }
        case "strong": {
          n += t.strong(s);
          break;
        }
        case "em": {
          n += t.em(s);
          break;
        }
        case "codespan": {
          n += t.codespan(s);
          break;
        }
        case "br": {
          n += t.br(s);
          break;
        }
        case "del": {
          n += t.del(s);
          break;
        }
        case "text": {
          n += t.text(s);
          break;
        }
        default: {
          let o = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return n;
  }
};
var $ = class {
  options;
  block;
  constructor(e) {
    this.options = e || O;
  }
  static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  provideLexer() {
    return this.block ? b.lex : b.lexInline;
  }
  provideParser() {
    return this.block ? R.parse : R.parseInline;
  }
};
var B = class {
  defaults = L();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = R;
  Renderer = P;
  TextRenderer = S;
  Lexer = b;
  Tokenizer = y;
  Hooks = $;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let r of e)
      switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          let i = r;
          for (let s of i.header)
            n = n.concat(this.walkTokens(s.tokens, t));
          for (let s of i.rows)
            for (let o of s)
              n = n.concat(this.walkTokens(o.tokens, t));
          break;
        }
        case "list": {
          let i = r;
          n = n.concat(this.walkTokens(i.items, t));
          break;
        }
        default: {
          let i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
            let o = i[s].flat(1 / 0);
            n = n.concat(this.walkTokens(o, t));
          }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let r = { ...n };
      if (r.async = this.defaults.async || r.async || false, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          let s = t.renderers[i.name];
          s ? t.renderers[i.name] = function(...o) {
            let a = i.renderer.apply(this, o);
            return a === false && (a = s.apply(this, o)), a;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          let s = t[i.level];
          s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), r.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new P(this.defaults);
        for (let s in n.renderer) {
          if (!(s in i))
            throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s))
            continue;
          let o = s, a = n.renderer[o], u = i[o];
          i[o] = (...p) => {
            let c = a.apply(i, p);
            return c === false && (c = u.apply(i, p)), c || "";
          };
        }
        r.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new y(this.defaults);
        for (let s in n.tokenizer) {
          if (!(s in i))
            throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s))
            continue;
          let o = s, a = n.tokenizer[o], u = i[o];
          i[o] = (...p) => {
            let c = a.apply(i, p);
            return c === false && (c = u.apply(i, p)), c;
          };
        }
        r.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new $;
        for (let s in n.hooks) {
          if (!(s in i))
            throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s))
            continue;
          let o = s, a = n.hooks[o], u = i[o];
          $.passThroughHooks.has(s) ? i[o] = (p) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(i, p)).then((f) => u.call(i, f));
            let c = a.call(i, p);
            return u.call(i, c);
          } : i[o] = (...p) => {
            let c = a.apply(i, p);
            return c === false && (c = u.apply(i, p)), c;
          };
        }
        r.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens, s = n.walkTokens;
        r.walkTokens = function(o) {
          let a = [];
          return a.push(s.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...r };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return b.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return R.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, r) => {
      let i = { ...r }, s = { ...this.defaults, ...i }, o = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === true && i.async === false)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      s.hooks && (s.hooks.options = s, s.hooks.block = e);
      let a = s.hooks ? s.hooks.provideLexer() : e ? b.lex : b.lexInline, u = s.hooks ? s.hooks.provideParser() : e ? R.parse : R.parseInline;
      if (s.async)
        return Promise.resolve(s.hooks ? s.hooks.preprocess(n) : n).then((p) => a(p, s)).then((p) => s.hooks ? s.hooks.processAllTokens(p) : p).then((p) => s.walkTokens ? Promise.all(this.walkTokens(p, s.walkTokens)).then(() => p) : p).then((p) => u(p, s)).then((p) => s.hooks ? s.hooks.postprocess(p) : p).catch(o);
      try {
        s.hooks && (n = s.hooks.preprocess(n));
        let p = a(n, s);
        s.hooks && (p = s.hooks.processAllTokens(p)), s.walkTokens && this.walkTokens(p, s.walkTokens);
        let c = u(p, s);
        return s.hooks && (c = s.hooks.postprocess(c)), c;
      } catch (p) {
        return o(p);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let r = "<p>An error occurred:</p><pre>" + w(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(r) : r;
      }
      if (t)
        return Promise.reject(n);
      throw n;
    };
  }
};
var _ = new B;
function d(l3, e) {
  return _.parse(l3, e);
}
d.options = d.setOptions = function(l3) {
  return _.setOptions(l3), d.defaults = _.defaults, H(d.defaults), d;
};
d.getDefaults = L;
d.defaults = O;
d.use = function(...l3) {
  return _.use(...l3), d.defaults = _.defaults, H(d.defaults), d;
};
d.walkTokens = function(l3, e) {
  return _.walkTokens(l3, e);
};
d.parseInline = _.parseInline;
d.Parser = R;
d.parser = R.parse;
d.Renderer = P;
d.TextRenderer = S;
d.Lexer = b;
d.lexer = b.lex;
d.Tokenizer = y;
d.Hooks = $;
d.parse = d;
var Dt = d.options;
var Zt = d.setOptions;
var Gt = d.use;
var Ht = d.walkTokens;
var Nt = d.parseInline;
var Ft = R.parse;
var Qt = b.lex;

// main.ts
var DIV = "ai-main-container";
var key = "";
var apiKeyStorageKey = "L2VnTsJG7BYcMOy&oj";
var ai;
var SYSTEM_MSG;
var SYSTEM_MSG_FALLBACK = `You are a concise search companion for Google queries.
Behavior:
- Answer directly first; then give 3–6 tight bullet points with key facts, tradeoffs, and next steps.
- Keep it brief and pragmatic. Avoid filler, hedging, and disclaimers unless safety-critical.
- If the query is ambiguous, state the top interpretation you’re using and continue.
- Prefer recent, broadly accepted knowledge; note if uncertainty is material.
- Format for fast scanning: short sentences, bold keywords, links only when essential.
- No roleplay, no theatrics. Output should fit well in a compact sidebar.
`;
var MODEL = "gpt-5-nano";
var settingsLoaded = false;
chrome.storage.sync.get([apiKeyStorageKey, "model", "systemPrompt"], (data) => {
  key = data[apiKeyStorageKey] || "";
  MODEL = data["model"] || "gpt-5-nano";
  SYSTEM_MSG = data["systemPrompt"] || SYSTEM_MSG_FALLBACK;
  if (!key) {
    console.error("No API Key found");
  }
  settingsLoaded = true;
  console.debug(`Loaded settings: Key found? ${!!key}, Model: ${MODEL}, System Prompt: ${SYSTEM_MSG}`);
});
var Position;
((Position2) => {
  Position2["just_results"] = "just_results";
  Position2["with_sidecard"] = "with_sidecard";
  Position2["with_web_sources"] = "with_web_sources";
})(Position ||= {});
Object.defineProperty(Position, "ToString", {
  value: function(position) {
    switch (position) {
      case "just_results" /* just_results */:
        return "Just Results";
      case "with_sidecard" /* with_sidecard */:
        return "With Sidecard";
      case "with_web_sources" /* with_web_sources */:
        return "With Web Sources";
    }
  },
  writable: false,
  enumerable: false,
  configurable: false
});
var position = undefined;
function decidePosition(rcnt) {
  if (rcnt.children.length === 1) {
    return "just_results" /* just_results */;
  } else if (rcnt.children.length >= 2) {
    let isOneOfTheChildATheSidecard = false;
    for (let child of rcnt.children) {
      if (child.id === "rhs") {
        isOneOfTheChildATheSidecard = true;
        break;
      }
    }
    if (isOneOfTheChildATheSidecard) {
      return "with_sidecard" /* with_sidecard */;
    } else {
      return "with_web_sources" /* with_web_sources */;
    }
  } else {
    return "just_results" /* just_results */;
  }
}
function placeDivInRcnt(rcnt, newDiv, position2) {
  switch (position2) {
    case "just_results" /* just_results */:
      rcnt.appendChild(newDiv);
      break;
    case "with_sidecard" /* with_sidecard */:
      const rhs = rcnt.querySelector("#rhs");
      rhs.insertBefore(newDiv, rhs.firstChild);
      break;
    case "with_web_sources" /* with_web_sources */:
      const centerCol = rcnt.querySelector("#center_col");
      const wrapper = document.createElement("div");
      wrapper.className = "flex flex-row space-x-10";
      wrapper.appendChild(centerCol);
      wrapper.appendChild(newDiv);
      rcnt.appendChild(wrapper);
      break;
  }
}
function getSearchQUery() {
  let queryInput = document.querySelector("textarea[name='q']");
  if (queryInput) {
    return queryInput.value;
  } else {
    console.warn("Query input not found");
    return "";
  }
}
var isFirstMessage = true;
var chatHistory = [];
async function makeAiRespond(msg, updateFunc) {
  if (isFirstMessage) {
    isFirstMessage = false;
    msg = `${SYSTEM_MSG}
${msg}`;
  }
  chatHistory.push({ role: "user", content: msg });
  const stream = await ai.chat.completions.create({
    model: MODEL,
    messages: chatHistory,
    stream: true
  });
  let aiResponse = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    aiResponse += content;
    updateFunc(content);
  }
  chatHistory.push({ role: "assistant", content: aiResponse });
}
function msgDiv(role) {
  const div = document.createElement("div");
  const id = `ai-msg-${Math.random().toString(36).substring(7)}`;
  div.id = id;
  div.className = "py-3 min-h-[2ch] rounded-xl mb-4 border text-gray-100";
  if (role === "user") {
    div.className += " self-end w-4/5 px-4 ai-msg-user";
  } else {
    div.className += " ai-msg ai-msg-assistant px-4";
  }
  const loader = document.createElement("div");
  if (role !== "user") {
    loader.className = "ai-typing";
    loader.innerHTML = '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>';
  }
  const content = document.createElement("div");
  content.className = "prose-sm";
  if (role !== "user") {
    div.appendChild(loader);
  }
  div.appendChild(content);
  const updateFunc = async (msg) => {
    let old = content.getAttribute("raw") || "";
    let raw = old + msg;
    content.setAttribute("raw", raw);
    if (role !== "user") {
      if (raw.length > 0) {
        loader.style.display = "none";
      }
    }
    content.innerHTML = await d(raw);
  };
  return [div, id, updateFunc];
}
function createDiv() {
  const div = document.createElement("div");
  div.id = DIV;
  let classes = [
    "flex",
    "flex-col",
    "rounded-2xl",
    "min-w-[30rem]",
    "border",
    "text-gray-100",
    "shadow-lg",
    "ai-panel"
  ];
  if (position === "with_sidecard" /* with_sidecard */) {
    classes = classes.concat(["w-full", "my-4"]);
  } else if (position === "just_results" /* just_results */) {
    classes = classes.concat(["max-w-[33%]", "h-min", "ml-[var(--rhs-margin)]"]);
  } else if (position === "with_web_sources" /* with_web_sources */) {}
  div.className = classes.join(" ");
  div.style.minWidth = "32rem";
  const dragBar = document.createElement("div");
  dragBar.className = "ai-drag-handle";
  const dragIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  dragIcon.setAttribute("viewBox", "0 0 24 14");
  dragIcon.setAttribute("aria-hidden", "true");
  dragIcon.classList.add("ai-drag-icon");
  const circlePositions = [
    [4, 5],
    [12, 5],
    [20, 5],
    [4, 11],
    [12, 11],
    [20, 11]
  ];
  for (const [cx, cy] of circlePositions) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", String(cx));
    c.setAttribute("cy", String(cy));
    c.setAttribute("r", "1.4");
    dragIcon.appendChild(c);
  }
  dragBar.appendChild(dragIcon);
  const header = document.createElement("div");
  header.className = "flex items-center justify-between mb-2";
  const left = document.createElement("div");
  left.className = "flex items-center gap-2";
  const title = document.createElement("span");
  title.textContent = "AI Assistant";
  title.className = "text-sm font-medium text-gray-200";
  const modelPill = document.createElement("span");
  modelPill.className = "text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-200";
  modelPill.textContent = MODEL;
  left.appendChild(title);
  left.appendChild(modelPill);
  const right = document.createElement("div");
  right.className = "flex items-center gap-2";
  const regenBtn = document.createElement("button");
  regenBtn.textContent = "Regenerate";
  regenBtn.className = "text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800";
  right.appendChild(regenBtn);
  header.appendChild(left);
  header.appendChild(right);
  const msgsDiv = document.createElement("div");
  msgsDiv.id = "ai-msgs";
  msgsDiv.className = "flex flex-col px-2 ai-msgs";
  const inputDiv = document.createElement("div");
  inputDiv.className = "flex flex-row mt-2";
  const input = document.createElement("textarea");
  input.className = "border border-gray-700 bg-gray-900 text-gray-100 rounded-xl p-2 w-full h-20";
  input.placeholder = "Ask a follow-up question… (Shift+Enter for newline)";
  inputDiv.appendChild(input);
  const sendButton = document.createElement("button");
  sendButton.innerText = "Send";
  sendButton.className = "bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-3 py-2 ml-2";
  let lastUserPrompt = "";
  sendButton.onclick = async () => {
    const [userDiv, , userUpdate] = msgDiv("user");
    addMessageToDiv(userDiv);
    let msg = input.value;
    userUpdate(msg);
    input.value = "";
    lastUserPrompt = msg;
    const [aiDiv, , aiUpdate] = msgDiv("ai");
    addMessageToDiv(aiDiv);
    makeAiRespond(msg, aiUpdate);
    input.focus();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
  inputDiv.appendChild(sendButton);
  regenBtn.onclick = () => {
    if (!lastUserPrompt)
      return;
    const [aiDiv, , aiUpdate] = msgDiv("ai");
    addMessageToDiv(aiDiv);
    makeAiRespond(lastUserPrompt, aiUpdate);
    input.focus();
  };
  div.appendChild(dragBar);
  const bodyDiv = document.createElement("div");
  bodyDiv.className = "ai-panel-body";
  bodyDiv.appendChild(header);
  bodyDiv.appendChild(msgsDiv);
  bodyDiv.appendChild(inputDiv);
  div.appendChild(bodyDiv);
  queueMicrotask(() => initDraggable(div, dragBar));
  return div;
}
function addMessageToDiv(div) {
  document.querySelector(`#ai-msgs`)?.appendChild(div);
}
function DisplayError(msg) {
  const error2 = document.createElement("div");
  error2.className = "border border-red-500 bg-red-200 p-4 rounded-xl text-red-900";
  error2.innerText = `Error: ${msg}!`;
  const container = document.getElementById(DIV);
  if (container) {
    container.innerHTML = "";
    container.appendChild(error2);
  } else {
    console.error("Container not found");
  }
  console.error(msg);
}
window.onload = async function() {
  const rcnt = document.getElementById("rcnt");
  if (!rcnt) {
    console.warn("Element with id 'rcnt' not found");
    return;
  }
  console.debug(`query: ${getSearchQUery()}`);
  console.debug(`using system msg: ${SYSTEM_MSG}`);
  if (rcnt) {
    position = decidePosition(rcnt);
    console.debug(`position: ${position}`);
    if (position === "just_results" /* just_results */) {
      rcnt.className += " !max-w-full";
    }
    const newDiv = createDiv();
    placeDivInRcnt(rcnt, newDiv, position);
    while (!settingsLoaded) {
      await new Promise((r) => setTimeout(r, 500));
      console.debug("Waiting for settings...");
    }
    if (!key) {
      chrome.storage.sync.get(apiKeyStorageKey, (data) => {
        if (apiKeyStorageKey in data) {
          DisplayError("API Key is set but empty. Please provide a valid key in the extension options.");
        } else {
          DisplayError("API Key not found. Please set it in the extension options.");
        }
      });
      return;
    }
    const query = getSearchQUery();
    ai = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true
    });
    try {
      await ai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_MSG }],
        stream: false
      });
      console.debug("Initial API connection successful.");
    } catch (error2) {
      console.error("Error during initial API connection test:", error2);
      DisplayError(`Failed to connect to the API. Please check your API key and network connection. Error: ${error2.message}`);
      return;
    }
    const [quebbinDiv, , quebbinUpdate] = msgDiv("user");
    addMessageToDiv(quebbinDiv);
    for (let word of query.split(" ")) {
      quebbinUpdate(" " + word);
      await new Promise((r) => setTimeout(r, 75));
    }
    const [aiDiv, , aiUpdate] = msgDiv("assistant");
    aiDiv.classList.add("ai-msg-assistant");
    addMessageToDiv(aiDiv);
    makeAiRespond(query, aiUpdate);
  }
};
function initDraggable(panel, handle) {
  let isFixed = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let placeholder = null;
  const onPointerDown = (ev) => {
    const target = ev.target;
    if (target.closest("button, a, input, textarea, select"))
      return;
    const rect = panel.getBoundingClientRect();
    if (!isFixed) {
      placeholder = document.createElement("div");
      placeholder.style.width = rect.width + "px";
      placeholder.style.height = rect.height + "px";
      placeholder.style.visibility = "hidden";
      const parent = panel.parentElement;
      if (parent) {
        parent.insertBefore(placeholder, panel);
      }
      panel.style.position = "fixed";
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      panel.style.width = rect.width + "px";
      panel.style.zIndex = "2147483647";
      isFixed = true;
      panel.classList.add("ai-panel--floating");
    }
    isDragging = true;
    startX = ev.clientX;
    startY = ev.clientY;
    startLeft = parseFloat(panel.style.left || "0");
    startTop = parseFloat(panel.style.top || "0");
    document.body.style.userSelect = "none";
    handle.classList.add("dragging");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };
  const onPointerMove = (ev) => {
    if (!isDragging)
      return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const rect = panel.getBoundingClientRect();
    let nextLeft = startLeft + dx;
    let nextTop = startTop + dy;
    const gutter = 8;
    const minLeft = -Math.max(0, rect.width - 48);
    nextLeft = Math.max(minLeft, Math.min(viewW - gutter, nextLeft));
    nextTop = Math.max(gutter, Math.min(viewH - gutter, nextTop));
    panel.style.left = nextLeft + "px";
    panel.style.top = nextTop + "px";
  };
  const onPointerUp = () => {
    isDragging = false;
    document.body.style.userSelect = "";
    handle.classList.remove("dragging");
    window.removeEventListener("pointermove", onPointerMove);
  };
  handle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", () => {
    if (!isFixed)
      return;
    const rect = panel.getBoundingClientRect();
    const gutter = 8;
    const minLeft = -Math.max(0, rect.width - 48);
    const left = Math.min(Math.max(minLeft, rect.left), window.innerWidth - gutter);
    const top = Math.min(Math.max(gutter, rect.top), window.innerHeight - gutter);
    panel.style.left = left + "px";
    panel.style.top = top + "px";
  });
}
