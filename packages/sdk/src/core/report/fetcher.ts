/* eslint-disable @typescript-eslint/ban-ts-comment */
const fetchByImage = (url: string, data: unknown) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `${url}?error=${encodeURIComponent(JSON.stringify(data))}`;
    img.onload = resolve;
    img.onerror = reject;
  });
};

const fetchByBeacon = (url: string, data: unknown) => {
  const dataStr = JSON.stringify(data);
  return navigator.sendBeacon(url, dataStr);
};

// @ts-ignore
export const safeFetchFn = navigator.sendBeacon ? fetchByBeacon : fetchByImage;

export const fetchFn = (url: string, data: unknown) => {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
