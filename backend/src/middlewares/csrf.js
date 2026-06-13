const csrfCookieName = process.env.CSRF_COOKIE_NAME || "csrfToken";

// Verifica CSRF in modo semplice: cookie CSRF + header CSRF uguali.
// - Il cookie deve essere letto dal browser -> NON HttpOnly.
// - L'header lo manda il frontend.

const requireCsrf = (req, res, next) => {
  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = req.cookies?.[csrfCookieName];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      message: "CSRF token non valido",
      status: 403,
    });
  }

  return next();
};

module.exports = { requireCsrf, csrfCookieName };

