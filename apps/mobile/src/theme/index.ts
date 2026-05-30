/**
 * Public surface of the design system. Import tokens, the Theme type, and the
 * theme hooks from "~/theme" — never reach into individual segment files from
 * a component or screen.
 */
export * from "./palette";
export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./radii";
export * from "./shadows";
export * from "./sizing";
export * from "./opacity";
export * from "./theme";
export { ThemeProvider, useTheme, useThemeContext } from "./ThemeProvider";
