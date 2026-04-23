import { HTMLAttributes } from 'react';

declare module 'react' {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean | string;
    global?: boolean;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      style: React.DetailedHTMLProps<
        React.StyleHTMLAttributes<HTMLStyleElement>,
        HTMLStyleElement
      >;
    }
  }
}
