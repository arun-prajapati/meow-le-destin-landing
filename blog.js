(() => {
  // Blog for Le Destin. Same API and key as contact.js.
  const SITE_SLUG = "httpledestinmeowadvancedintelligencecom-1788513931";
  const API_KEY = "site_ecb8ededa4649b0d3c0081a3605884d2fcc794a59f13a29d";
  const BASE_URL = "https://lemeowapis.meowadvancedintelligence.com";
  const SITE_URL = "https://ledestin.meowadvancedintelligence.com";
  const BRAND = "Le Destin";
  const LOGO_URL = `${SITE_URL}/images/icon-192.png`;
  const SPINNER_CLASS = "spinner";
  const BUTTON_CLASS = "btn";

  const listEl = document.getElementById("blogList"); // blog.html
  const postEl = document.getElementById("blogPost"); // blog-post.html
  if (!listEl && !postEl) return;

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const textOf = (html) => {
    const div = document.createElement("div");
    div.innerHTML = String(html ?? "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  };

  const assetUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${BASE_URL}/${String(path).replace(/^\/+/, "")}`;
  };

  const toDate = (value) => {
    const d = new Date(String(value ?? "").replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d;
  };
  const formatDate = (value) => {
    const d = toDate(value);
    return d ? d.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : "";
  };
  const isoDate = (value) => {
    const d = toDate(value);
    return d ? d.toISOString() : undefined;
  };

  const postLink = (slug) => `/blog-post.html?slug=${encodeURIComponent(slug)}`;

  // The API can return [], { data: [] } or { data: { data: [] } }
  const unwrap = (json) => {
    if (Array.isArray(json)) return json;
    const d = json && json.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    if (d && Array.isArray(d.items)) return d.items;
    return [];
  };

  // Article HTML comes from the admin panel: keep only safe tags and links.
  const ALLOWED = new Set(["P", "BR", "HR", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "STRONG", "B", "EM", "I", "U", "S", "CODE", "PRE", "A", "IMG", "FIGURE", "FIGCAPTION", "SPAN", "DIV", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "SUB", "SUP", "SMALL", "MARK"]);
  const REMOVE = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "SVG", "MATH", "LINK", "META", "BASE", "NOSCRIPT", "TEMPLATE", "VIDEO", "AUDIO"]);
  const SAFE_URL = /^(https?:|mailto:|tel:|#|\/(?!\/))/i;

  function sanitize(html) {
    const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
    const root = doc.body.firstChild;
    const walk = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 8) { child.remove(); continue; } // comments
        if (child.nodeType !== 1) continue;
        let el = child;
        if (REMOVE.has(el.tagName)) { el.remove(); continue; }
        if (el.tagName === "H1") { // the page already has one <h1>
          const h2 = doc.createElement("h2");
          h2.append(...el.childNodes);
          el.replaceWith(h2);
          el = h2;
        }
        if (!ALLOWED.has(el.tagName)) { walk(el); el.replaceWith(...el.childNodes); continue; }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const keep =
            (el.tagName === "A" && (name === "href" || name === "target")) ||
            (el.tagName === "IMG" && (name === "src" || name === "alt" || name === "width" || name === "height")) ||
            ((el.tagName === "TD" || el.tagName === "TH") && (name === "colspan" || name === "rowspan"));
          if (!keep) el.removeAttribute(attr.name);
        }
        if (el.tagName === "A") {
          const href = (el.getAttribute("href") || "").trim();
          if (!SAFE_URL.test(href)) el.removeAttribute("href");
          if (el.getAttribute("target") === "_blank") el.setAttribute("rel", "noopener noreferrer");
          else el.removeAttribute("target");
        }
        if (el.tagName === "IMG") {
          const src = (el.getAttribute("src") || "").trim();
          if (/^https?:\/\//i.test(src)) el.setAttribute("src", src);
          else if (/^\/(?!\/)/.test(src)) el.setAttribute("src", assetUrl(src));
          else { el.remove(); continue; }
          if (!el.hasAttribute("alt")) el.setAttribute("alt", "");
          el.setAttribute("loading", "lazy");
        }
        walk(el);
      }
    };
    walk(root);
    return root.innerHTML;
  }

  function setTag(selector, attr, value) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.startsWith("link") ? "link" : "meta");
      const m = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
      el.setAttribute(m[1], m[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function setPostMeta(post, url) {
    const title = `${post.title} | ${BRAND}`;
    document.title = title;
    setTag('link[rel="canonical"]', "href", url);
    setTag('meta[property="og:url"]', "content", url);
    setTag('meta[property="og:type"]', "content", "article");
    setTag('meta[property="og:title"]', "content", title);
    setTag('meta[name="twitter:title"]', "content", title);
    if (post.description) {
      setTag('meta[name="description"]', "content", post.description);
      setTag('meta[property="og:description"]', "content", post.description);
      setTag('meta[name="twitter:description"]', "content", post.description);
    }
    if (post.image) {
      setTag('meta[property="og:image"]', "content", post.image);
      setTag('meta[name="twitter:image"]', "content", post.image);
      document.head.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"]').forEach((m) => m.remove());
    }

    // BlogPosting structured data (SEO audit: every post needs Article / BlogPosting JSON-LD)
    const data = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title.slice(0, 110),
      description: post.description || undefined,
      image: post.image ? [post.image] : undefined,
      datePublished: isoDate(post.date),
      dateModified: isoDate(post.updated || post.date),
      author: { "@type": "Organization", name: BRAND, url: `${SITE_URL}/` },
      publisher: { "@type": "Organization", name: BRAND, logo: { "@type": "ImageObject", url: LOGO_URL } },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  async function fetchPosts() {
    const res = await fetch(`${BASE_URL}/api/sites/${SITE_SLUG}/blogs?nopaginate=1`, {
      headers: { "X-Site-Api-Key": API_KEY, "X-Platform": "web", Accept: "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
    return unwrap(json)
      .filter((p) => p && p.slug && p.title)
      .filter((p) => !p.status || p.status === "published" || (p.pivot && p.pivot.status === "published"))
      .map((p) => {
        const excerpt = textOf(p.excerpt || p.description || p.content);
        return {
          slug: String(p.slug),
          title: textOf(p.title),
          excerpt: excerpt.slice(0, 180),
          description: excerpt.slice(0, 155),
          content: p.content || "",
          image: assetUrl(p.cover_photo_url || p.featured_image_url || p.cover_photo || p.featured_image),
          date: p.published_at || (p.pivot && p.pivot.published_at) || p.created_at || "",
          updated: p.updated_at || "",
        };
      })
      .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0));
  }

  const card = (p, level) => `
    <a class="blog-card" href="${postLink(p.slug)}">
      ${p.image ? `<div class="blog-thumb"><img src="${esc(p.image)}" alt="" loading="lazy" /></div>` : ""}
      <div class="blog-card-body">
        ${p.date ? `<p class="blog-date"><time datetime="${esc(isoDate(p.date) || "")}">${esc(formatDate(p.date))}</time></p>` : ""}
        <${level}>${esc(p.title)}</${level}>
        ${p.excerpt ? `<p class="blog-excerpt">${esc(p.excerpt)}</p>` : ""}
      </div>
    </a>`;

  const message = (title, text, retry) => `
    <div class="blog-message">
      <h2>${title}</h2>
      <p>${text}</p>
      ${retry ? `<button type="button" class="${BUTTON_CLASS}" id="blogRetry">Retry</button>` : ""}
    </div>`;

  const loading = (text) => `<div class="legal-loading"><div class="${SPINNER_CLASS}"></div><span>${text}</span></div>`;

  // ---------- blog.html: list of posts ----------
  async function showList() {
    listEl.innerHTML = loading("Loading articles...");
    try {
      const posts = await fetchPosts();
      listEl.innerHTML = posts.length
        ? `<div class="blog-grid">${posts.map((p) => card(p, "h2")).join("")}</div>`
        : message("No articles yet", "New articles are on the way. Check back soon.");
    } catch (err) {
      console.error("Error loading blog:", err);
      listEl.innerHTML = message("Unable to load articles", "Please try again in a moment.", true);
      document.getElementById("blogRetry")?.addEventListener("click", showList);
    }
  }

  // ---------- blog-post.html?slug=...: one post ----------
  const titleEl = document.getElementById("postTitle");
  const dateEl = document.getElementById("postMeta");

  function notFound() {
    document.title = `Article not found | ${BRAND}`;
    setTag('meta[name="robots"]', "content", "noindex");
    if (titleEl) titleEl.textContent = "Article not found";
    postEl.innerHTML = message("This article isn’t available", 'It may have been moved or removed. <a href="/blog.html">See all articles</a>.');
  }

  async function showPost() {
    const slug = new URLSearchParams(location.search).get("slug");
    if (!slug) { location.replace("/blog.html"); return; }
    postEl.innerHTML = loading("Loading article...");
    try {
      const posts = await fetchPosts();
      const post = posts.find((p) => p.slug === slug);
      if (!post) { notFound(); return; }
      const url = `${SITE_URL}${postLink(post.slug)}`;
      setPostMeta(post, url);
      if (titleEl) titleEl.textContent = post.title;
      if (dateEl && post.date) {
        dateEl.innerHTML = `<time datetime="${esc(isoDate(post.date) || "")}">${esc(formatDate(post.date))}</time>`;
        dateEl.hidden = false;
      }
      const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
      postEl.innerHTML = `
        <article>
          ${post.image ? `<figure class="blog-cover"><img src="${esc(post.image)}" alt="${esc(post.title)}" /></figure>` : ""}
          <div class="legal-card"><div class="legal-content blog-content">${sanitize(post.content)}</div></div>
        </article>
        ${more.length ? `<section class="blog-more" aria-labelledby="moreTitle"><h2 id="moreTitle">More articles</h2><div class="blog-grid">${more.map((p) => card(p, "h3")).join("")}</div></section>` : ""}`;
    } catch (err) {
      console.error("Error loading article:", err);
      postEl.innerHTML = message("Unable to load this article", "Please try again in a moment.", true);
      document.getElementById("blogRetry")?.addEventListener("click", showPost);
    }
  }

  if (listEl) showList();
  if (postEl) showPost();
})();
