import gsap from 'gsap';

/**
 * GSAP Micro-interaction and entrance animation utilities
 */

export const staggerEntrance = (targets, options = {}) => {
  if (!targets) return;
  const elements = typeof targets === 'string' ? document.querySelectorAll(targets) : targets;
  if (!elements || elements.length === 0) return;

  return gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: options.y || 16,
      scale: options.scale || 0.98,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: options.duration || 0.45,
      stagger: options.stagger !== undefined ? options.stagger : 0.06,
      ease: options.ease || 'power2.out',
      delay: options.delay || 0,
    }
  );
};

export const animateModalEntry = (modalElement) => {
  if (!modalElement) return;
  return gsap.fromTo(
    modalElement,
    {
      opacity: 0,
      scale: 0.94,
      y: 12,
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: 'back.out(1.4)',
    }
  );
};

export const animateNumberCounter = (element, targetValue, duration = 1) => {
  if (!element || targetValue === undefined || targetValue === null) return;
  const num = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue);
  if (isNaN(num)) return;

  const obj = { val: 0 };
  return gsap.to(obj, {
    val: num,
    duration,
    ease: 'power1.out',
    onUpdate: () => {
      if (element) {
        element.innerText = Math.round(obj.val).toLocaleString();
      }
    },
  });
};

export const animateButtonPress = (btnElement) => {
  if (!btnElement) return;
  gsap.timeline()
    .to(btnElement, { scale: 0.96, duration: 0.08, ease: 'power1.in' })
    .to(btnElement, { scale: 1, duration: 0.15, ease: 'back.out(2)' });
};
