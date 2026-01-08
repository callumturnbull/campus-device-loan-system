const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;     
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE; 
const ROLE_CLAIM = process.env.ROLE_CLAIM || "https://cnd.example/roles";

function getJwksClient() {
  if (!AUTH0_DOMAIN) throw new Error("AUTH0_DOMAIN missing");
  return jwksClient({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000
  });
}

function getKey(header, callback) {
  const client = getJwksClient();
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyJwtFromRequest(request) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const token = auth.slice("Bearer ".length).trim();

  return new Promise((resolve) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ["RS256"]
      },
      (err, decoded) => {
        if (err) return resolve({ ok: false, status: 401, error: "Invalid token" });
        resolve({ ok: true, decoded });
      }
    );
  });
}

function hasRole(decoded, role) {
  const roles = decoded?.[ROLE_CLAIM];
  if (Array.isArray(roles)) return roles.includes(role);
  if (typeof roles === "string") return roles === role;
  return false;
}

function requireAuth() {
  return async (request) => {
    try {
      const result = await verifyJwtFromRequest(request);
      if (!result.ok) return result;
      return { ok: true, decoded: result.decoded };
    } catch {
      return { ok: false, status: 500, error: "Auth misconfigured" };
    }
  };
}

function requireRole(role) {
  return async (request) => {
    const auth = await requireAuth()(request);
    if (!auth.ok) return auth;
    if (!hasRole(auth.decoded, role)) {
      return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, decoded: auth.decoded };
  };
}

module.exports = { requireAuth, requireRole };
