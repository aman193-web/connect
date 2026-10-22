(() => {
  'use strict';
  const video = document.querySelector('#plexus');
  const scenes = [...document.querySelectorAll('.scene')];
  const chapters = [...document.querySelectorAll('.chapter')];
  const motionToggle = document.querySelector('#motion-toggle');
  const status = document.querySelector('#film-status');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clock = { time: 0 };
  const listeners = new AbortController();
  const signal = listeners.signal;
  let timeline, context, activeScene = -1, desiredTime = 0, retryFrame = 0;
  let motionDisabled = reduceMotion.matches, videoReady = false, loadTimer;
  const sceneStarts = [0, 2.85, 5.65, 8.65, 11.65];
  const source = matchMedia('(max-width: 700px)').matches ? 'assets/plexus-mobile.mp4' : 'assets/plexus-scrub.mp4';

  function setAccessibleScene(index) {
    if (activeScene === index) return;
    activeScene = index;
    scenes.forEach((scene, i) => {
      scene.setAttribute('aria-hidden', String(i !== index));
      scene.inert = i !== index;
    });
    chapters.forEach((button, i) => {
      button.classList.toggle('active', i === index);
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  // Coalesce rapid wheel input: never queue stale seeks behind an active decode.
  function seekLatestFrame() {
    cancelAnimationFrame(retryFrame);
    if (!videoReady || motionDisabled || video.seeking) return;
    const target = Math.min(desiredTime, Math.max(0, video.duration - 0.04));
    if (Math.abs(video.currentTime - target) >= 0.018) video.currentTime = target;
  }
  function updateSequence() {
    desiredTime = clock.time;
    seekLatestFrame();
    let index = 0;
    for (let i = 1; i < sceneStarts.length; i++) {
      if (clock.time >= sceneStarts[i] - 0.1) index = i;
    }
    setAccessibleScene(index);
  }
  video.addEventListener('seeked', () => {
    retryFrame = requestAnimationFrame(seekLatestFrame);
  }, {signal});

  function buildExperience() {
    if (context) context.revert();
    timeline = undefined;
    document.body.classList.toggle('static-mode', motionDisabled);
    motionToggle.setAttribute('aria-pressed', String(motionDisabled));
    motionToggle.innerHTML = `<span class="motion-icon" aria-hidden="true">◉</span> Motion ${motionDisabled ? 'off' : 'on'}`;
    activeScene = -1;
    if (motionDisabled || !window.gsap || !window.ScrollTrigger) {
      document.body.classList.add('static-mode');
      setAccessibleScene(4);
      video.pause();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ignoreMobileResize: true});
    context = gsap.context(() => {
      gsap.set(scenes, {autoAlpha: 0, y: 16, scale: 0.99});
      gsap.set(scenes[0], {autoAlpha: 1, y: 0, scale: 1});
      clock.time = 0;
      const duration = videoReady ? video.duration - 0.04 : 14.28;
      timeline = gsap.timeline({
        defaults: {ease: 'none'},
        onUpdate: updateSequence,
        scrollTrigger: {
          id: 'connect-film', trigger: '.cinema', start: 'top top',
          end: () => `+=${Math.max(3200, Math.round(innerHeight * (innerWidth < 700 ? 4.8 : 5.5)))}`,
          pin: true, scrub: matchMedia('(pointer: coarse)').matches ? 0.35 : 0.65,
          anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      timeline.to(clock, {time: duration, duration}, 0);
      timeline.to('.progress-fill', {scaleX: 1, duration}, 0);
      sceneStarts.slice(1).forEach((time, i) => {
        timeline.to(scenes[i], {autoAlpha: 0, y: -12, scale: 1.01, duration: 0.68, ease: 'power2.inOut'}, time - 0.76);
        timeline.fromTo(scenes[i + 1], {autoAlpha: 0, y: 16, scale: 0.99}, {autoAlpha: 1, y: 0, scale: 1, duration: 0.88, ease: 'power2.out', immediateRender: false}, time - 0.18);
      });
      setAccessibleScene(0);
    });
    ScrollTrigger.refresh();
    updateSequence();
  }
  function loadVideo() {
    if (video.getAttribute('src')) return;
    video.src = source;
    video.load();
    loadTimer = setTimeout(() => {
      if (!videoReady) status.textContent = 'Loading the film. You can keep exploring.';
    }, 10000);
  }
  video.addEventListener('loadeddata', () => {
    videoReady = true;
    clearTimeout(loadTimer);
    status.textContent = '';
    seekLatestFrame();
  }, {signal});
  video.addEventListener('error', () => {
    clearTimeout(loadTimer);
    status.textContent = 'Film unavailable. Explore the ecosystem below.';
    motionDisabled = true;
    buildExperience();
  }, {signal});
  motionToggle.addEventListener('click', () => {
    const atHero = scrollY < (timeline?.scrollTrigger?.end ?? innerHeight);
    motionDisabled = !motionDisabled;
    if (!motionDisabled) loadVideo();
    buildExperience();
    if (atHero) window.scrollTo({top: 0, behavior: 'instant'});
  }, {signal});
  reduceMotion.addEventListener('change', event => {
    motionDisabled = event.matches;
    if (!motionDisabled) loadVideo();
    buildExperience();
  }, {signal});
  chapters.forEach(button => button.addEventListener('click', () => {
    const trigger = timeline?.scrollTrigger;
    if (!trigger) return;
    window.scrollTo({top: trigger.start + Number(button.dataset.progress) * (trigger.end - trigger.start), behavior: 'instant'});
  }, {signal}));
  document.querySelectorAll('a[href="#explore"], a[href="#top"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.hash);
      target.scrollIntoView({behavior: 'instant', block: 'start'});
      if (link.hash === '#explore') target.focus({preventScroll: true});
      history.replaceState(null, '', link.hash);
    }, {signal});
  });
  buildExperience();
  if (!motionDisabled) loadVideo();
  // Restore anchor navigation after pin spacing has been established.
  if (location.hash === '#explore') requestAnimationFrame(() => document.querySelector('#explore').scrollIntoView());
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    clearTimeout(loadTimer);
    cancelAnimationFrame(retryFrame);
    context?.revert();
    video.pause();
    listeners.abort();
  }, {once: true});
})();
