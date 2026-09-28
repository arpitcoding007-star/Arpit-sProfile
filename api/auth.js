export default async function handler(req, res) {
  const { host } = req.headers;
  const protocol = req.headers['x-forwarded-proto'] || 'http';

  // GET: Show the login form
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CMS Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Barlow, 'Helvetica Neue', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #ECEEEF; color: #1B1D1F; margin: 0; padding: 24px; box-sizing: border-box; }
          form { width: min(100%, 340px); aspect-ratio: 1; display: flex; flex-direction: column; justify-content: center; padding: 56px; border-radius: 50%; background: #A6C8CE; box-sizing: border-box; }
          h2 { font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; font-size: 20px; }
          label { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
          input { width: 100%; padding: 12px 16px; margin: 12px 0; border-radius: 999px; border: 1px solid rgba(27,29,31,0.25); background: #F4F5F6; color: #1B1D1F; box-sizing: border-box; font: inherit; }
          input:focus { outline: 2px solid #3F7F8A; outline-offset: 2px; }
          button { width: 100%; padding: 12px; background: #1B1D1F; border: none; border-radius: 999px; color: #fff; font: inherit; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; }
          button:hover { background: #2F6A74; }
        </style>
      </head>
      <body>
        <form method="POST">
          <h2 style="margin-top:0">CMS Access</h2>
          <label>Enter Password:</label>
          <input type="password" name="password" required autofocus />
          <button type="submit">Login</button>
        </form>
      </body>
      </html>
    `);
  }

  // POST: Check password and redirect
  if (req.method === 'POST') {
    const body = await req.body;
    // Vercel might parse JSON/URL-encoded automatically or we might need to parse it
    // For simple form POST:
    const password = body.password || (typeof body === 'string' ? new URLSearchParams(body).get('password') : null);

    if (password === process.env.CMS_PASSWORD) {
      // Success: Redirect to callback with a temporary "code" (which we don't really use for security, just flow)
      return res.redirect(302, `${protocol}://${host}/api/callback?code=authorized`);
    } else {
      return res.status(401).send('Invalid password. <a href="/api/auth">Try again</a>');
    }
  }
}
