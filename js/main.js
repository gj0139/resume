/* ==========================================================================
   高聚 · 个人简历网站  —  交互与动画
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- 1. 入场动画 */
  var revealItems = $$('.reveal');

  revealItems.forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) { el.style.setProperty('--d', d); }
  });

  function showAll() {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (el) { io.observe(el); });

    /* 兜底：页面加载 3.5 秒后仍未进入视口的元素也直接显示 */
    window.setTimeout(function () {
      revealItems.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) { el.classList.add('is-visible'); }
      });
    }, 3500);
  }

  /* ---------------------------------------------------------------- 2. 打字机 */
  var typedEl = $('#typed');
  var PHRASES = ['物流运营', '软件测试', '技术运维', '综合行政'];

  if (typedEl) {
    if (reduceMotion) {
      typedEl.textContent = PHRASES.join(' / ');
    } else {
      var pi = 0, ci = 0, deleting = false;

      var tick = function () {
        var word = PHRASES[pi];

        if (!deleting) {
          ci++;
          typedEl.textContent = word.slice(0, ci);
          if (ci === word.length) {
            deleting = true;
            window.setTimeout(tick, 1500);
            return;
          }
          window.setTimeout(tick, 115 + Math.random() * 70);
        } else {
          ci--;
          typedEl.textContent = word.slice(0, ci);
          if (ci === 0) {
            deleting = false;
            pi = (pi + 1) % PHRASES.length;
            window.setTimeout(tick, 380);
            return;
          }
          window.setTimeout(tick, 55);
        }
      };

      window.setTimeout(tick, 700);
    }
  }

  /* ---------------------------------------------------------------- 3. 滚动进度条 */
  var progress = $('#scrollProgress');

  /* ---------------------------------------------------------------- 4. 导航 */
  var nav       = $('#nav');
  var navLinks  = $('#navLinks');
  var navToggle = $('#navToggle');
  var indicator = $('#navIndicator');
  var anchors   = $$('#navLinks > a');

  var sections = anchors.map(function (a) {
    var id = a.getAttribute('href');
    return { link: a, el: id && id.length > 1 ? $(id) : null };
  }).filter(function (s) { return s.el; });

  function moveIndicator(link) {
    if (!indicator || !link || window.innerWidth <= 900) { return; }
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    indicator.classList.add('is-on');
  }

  function setActive(link) {
    if (!link || (anchors.indexOf(link) !== -1 && link.classList.contains('is-active'))) { return; }
    anchors.forEach(function (a) { a.classList.remove('is-active'); });
    link.classList.add('is-active');
    moveIndicator(link);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* 锚点平滑滚动（补偿固定导航高度） */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') { return; }
      var target = $(href);
      if (!target) { return; }

      e.preventDefault();

      if (navLinks && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); }
      }

      var offset = (nav ? nav.offsetHeight : 0) + 14;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) { history.replaceState(null, '', href); }
    });
  });

  /* ---------------------------------------------------------------- 5. 滚动联动 */
  var timeline = $('#timeline');
  var tlProgress = $('#timelineProgress');
  var toTop = $('#toTop');
  var ticking = false;

  function onScrollFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    /* 进度条 */
    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docH > 0 ? Math.min(y / docH, 1) * 100 : 0) + '%';
    }

    /* 导航吸顶 */
    if (nav) { nav.classList.toggle('is-stuck', y > 24); }

    /* 返回顶部按钮 */
    if (toTop) { toTop.classList.toggle('is-on', y > 520); }

    /* 时间轴进度线 */
    if (timeline && tlProgress) {
      var rect = timeline.getBoundingClientRect();
      var anchor = window.innerHeight * 0.8;
      var p = rect.height > 0 ? (anchor - rect.top) / rect.height : 0;
      p = Math.max(0, Math.min(1, p));
      tlProgress.style.transform = 'scaleY(' + p + ')';
    }

    /* 当前区块高亮：以视口 35% 高度处作为判定线 */
    if (sections.length) {
      var probe = y + window.innerHeight * 0.35;
      var current = sections[0];

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.offsetTop <= probe) { current = sections[i]; }
      }

      /* 页底时高亮最后一项 */
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1];
      }
      setActive(current.link);
    }

    ticking = false;
  }

  function requestFrame() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', function () {
    requestFrame();
    var active = $('#navLinks > a.is-active');
    if (active) { moveIndicator(active); }
  });
  window.addEventListener('load', requestFrame);

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------- 6. 光标光晕 */
  var glow = $('#cursorGlow');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (glow && finePointer && !reduceMotion) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, gRaf = null;

    var drawGlow = function () {
      glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      gRaf = null;
    };

    window.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY;
      glow.classList.add('is-on');
      if (gRaf === null) { gRaf = window.requestAnimationFrame(drawGlow); }
    }, { passive: true });

    document.addEventListener('mouseleave', function () { glow.classList.remove('is-on'); });
  }

  /* ---------------------------------------------------------------- 7. 打印 */
  var printBtn = $('#printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      showAll();
      window.setTimeout(function () { window.print(); }, 60);
    });
  }

  /* ---------------------------------------------------------------- 8. 首帧初始化 */
  requestFrame();
  window.setTimeout(requestFrame, 250);
})();
