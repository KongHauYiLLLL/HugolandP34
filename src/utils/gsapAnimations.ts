import { gsap } from 'gsap';

// Initialize GSAP animations
export const initGSAPAnimations = () => {
  // Set default ease
  gsap.defaults({ ease: "power2.out" });

  // Clear any existing animations first
  gsap.killTweensOf('.gsap-fade-in, .gsap-slide-in-left, .gsap-slide-in-right, .gsap-scale-in, .gsap-rotate-in');

  // Fade in animation
  const fadeElements = document.querySelectorAll('.gsap-fade-in');
  if (fadeElements.length > 0) {
    gsap.set(fadeElements, { opacity: 0, y: 20 });
    gsap.to(fadeElements, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.1
    });
  }

  // Slide in from left
  const slideLeftElements = document.querySelectorAll('.gsap-slide-in-left');
  if (slideLeftElements.length > 0) {
    gsap.set(slideLeftElements, { opacity: 0, x: -50 });
    gsap.to(slideLeftElements, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      stagger: 0.15,
      delay: 0.2
    });
  }

  // Slide in from right
  const slideRightElements = document.querySelectorAll('.gsap-slide-in-right');
  if (slideRightElements.length > 0) {
    gsap.set(slideRightElements, { opacity: 0, x: 50 });
    gsap.to(slideRightElements, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      stagger: 0.15,
      delay: 0.2
    });
  }

  // Scale in animation
  const scaleElements = document.querySelectorAll('.gsap-scale-in');
  if (scaleElements.length > 0) {
    gsap.set(scaleElements, { opacity: 0, scale: 0.8 });
    gsap.to(scaleElements, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger: 0.1,
      delay: 0.3
    });
  }

  // Rotate in animation
  const rotateElements = document.querySelectorAll('.gsap-rotate-in');
  if (rotateElements.length > 0) {
    gsap.set(rotateElements, { opacity: 0, rotation: -10, scale: 0.9 });
    gsap.to(rotateElements, {
      opacity: 1,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.12,
      delay: 0.4
    });
  }
};

// Animate element on hover
export const animateOnHover = (element: HTMLElement) => {
  const tl = gsap.timeline({ paused: true });
  
  tl.to(element, {
    scale: 1.05,
    duration: 0.3,
    ease: "power2.out"
  });

  element.addEventListener('mouseenter', () => tl.play());
  element.addEventListener('mouseleave', () => tl.reverse());
};

// Animate button click
export const animateButtonClick = (element: HTMLElement) => {
  gsap.to(element, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut"
  });
};

// Animate modal entrance
export const animateModalEntrance = (element: HTMLElement) => {
  gsap.fromTo(element, 
    {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    }
  );
};

// Animate modal exit
export const animateModalExit = (element: HTMLElement, onComplete?: () => void) => {
  gsap.to(element, {
    opacity: 0,
    scale: 0.8,
    y: -50,
    duration: 0.3,
    ease: "power2.in",
    onComplete
  });
};

// Animate number counting
export const animateNumberCount = (element: HTMLElement, from: number, to: number, duration: number = 1) => {
  const obj = { value: from };
  
  gsap.to(obj, {
    value: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toLocaleString();
    }
  });
};

// Animate progress bar
export const animateProgressBar = (element: HTMLElement, progress: number) => {
  gsap.to(element, {
    width: `${progress}%`,
    duration: 1,
    ease: "power2.out"
  });
};

// Shake animation for errors
export const shakeAnimation = (element: HTMLElement) => {
  gsap.to(element, {
    x: -10,
    duration: 0.1,
    yoyo: true,
    repeat: 5,
    ease: "power2.inOut",
    onComplete: () => {
      gsap.set(element, { x: 0 });
    }
  });
};

// Pulse animation for notifications
export const pulseAnimation = (element: HTMLElement) => {
  gsap.to(element, {
    scale: 1.1,
    duration: 0.5,
    yoyo: true,
    repeat: -1,
    ease: "power2.inOut"
  });
};

// Floating animation
export const floatingAnimation = (element: HTMLElement) => {
  gsap.to(element, {
    y: -10,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "power2.inOut"
  });
};

// Stagger animation for lists
export const staggerAnimation = (elements: NodeListOf<Element> | Element[]) => {
  gsap.fromTo(elements,
    {
      opacity: 0,
      y: 30
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out"
    }
  );
};