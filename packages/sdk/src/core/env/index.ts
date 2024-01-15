import type { DarePlugin, EnvData } from "@sdk/type";

export type EnvPluginOptions = {
  formater?: <T extends EnvData>(msg: T) => Record<string, unknown>;
};

export const envPlugin: DarePlugin<EnvPluginOptions> = () => {
  const getEnvData = (): EnvData => {
    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    const timezone =
      timezoneOffset > 0 ? `UTC-${timezoneOffset}` : `UTC+${-timezoneOffset}`;

    return {
      userAgent: navigator.userAgent, // 浏览器用户代理字符串
      language: navigator.language, // 浏览器语言
      platform: navigator.platform, // 平台（操作系统）
      screenWidth: window.screen.width, // 屏幕宽度
      screenHeight: window.screen.height, // 屏幕高度
      windowWidth: window.innerWidth, // 浏览器窗口宽度
      windowHeight: window.innerHeight, // 浏览器窗口高度
      connection: navigator.connection
        ? {
            downlink: navigator.connection.downlink, // 下行速度
            effectiveType: navigator.connection.effectiveType, // 网络连接类型
            rtt: navigator.connection.rtt, // 往返时间
          }
        : null, // 网络信息
      location: window.location.href, // 当前页面 URL
      time: new Date().toISOString(), // 当前时间
      timezone, // 时区
    };
  };

  return {
    version: "0.0.1",
    before: (context) => {
      context.core.getEnv = getEnvData;
    },
  };
};
