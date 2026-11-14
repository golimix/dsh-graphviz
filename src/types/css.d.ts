/** esbuild's `text` loader turns a stylesheet import into its source text. */
declare module '*.css' {
  const content: string
  export default content
}
