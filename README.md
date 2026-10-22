# Connect — cinematic scroll header

A self-contained, buildless site using GSAP 3.14.2 and ScrollTrigger. Serve `dist/` over HTTP; no npm install or build is required.

## Local preview

Run `python3 -m http.server 4173 --directory dist` here and open http://localhost:4173. Production hosting should support HTTP byte ranges for MP4 seeking.

## Files

- `dist/index.html`: navigation, five cinematic scenes, and ecosystem links.
- `dist/styles.css`: responsive layout, typography, and reduced-motion fallback.
- `dist/app.js`: coordinated GSAP timeline, video seeking, chapter navigation, and cleanup.
- `dist/assets/`: locally bundled GSAP, ScrollTrigger, and optimized footage.

## Footage and timing

Uses the supplied `Plexus Final Scerne.mp4`: 1920×1080, 25 fps, 14.32 seconds, H.264. Both derivatives preserve the full sequence and original colors. Desktop: 1440×810. Mobile: 960×540. Encoding: H.264 CRF 24, every frame a keyframe, no B-frames, fast-start metadata. Poster: the original first frame.

One timeline maps scrolling to 0–14.28 seconds with 0.65-second smoothing for mouse/trackpad and 0.35 seconds for coarse-pointer touch devices. Scene entrances: 0, 2.85, 5.65, 8.65, and 11.65 seconds. Copy and progress use the same timeline. Video seeks are coalesced to the latest target; browser decoding can introduce a short presentation delay.

Desktop scroll distance is 5.5 viewport heights; mobile is 4.8, with a 3200px minimum. Wheel, trackpad, touch, and keyboard use native scrolling. Chapter controls jump to specific moments. The pin releases into the following section.

## Accessibility

Reduced-motion preference presents the final static scene without pinning. The Motion control toggles this fallback. Hidden scenes are inert and excluded from the accessibility tree. Skip links, visible focus styles, error fallback, and event/timeline cleanup are included.

Explore links lead to the official MCP Registry and documentation. This site does not implement account registration, a server-directory backend, or actual MCP connections.

## Verification

JavaScript syntax passed. Browser checked at 552×736: intro, forward and reverse scrolling, chapter selection, final CTA, pin release, no horizontal overflow. Video advanced from 0 to 4.46 seconds and reversed to 0 while remaining paused. Final chapter reached 13.14 seconds. Motion off left zero pin spacers and displayed the final static scene. No console errors or warnings during these interactions. Full desktop and physical-device testing remain unverified.

Text entrances use 0.88-second timeline transitions with restrained 16px movement; exits use 0.68 seconds and 12px movement. The timeline smoothing absorbs discrete wheel steps without intercepting native scroll input.
