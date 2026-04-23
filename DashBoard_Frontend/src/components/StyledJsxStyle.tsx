import React from 'react';

interface StyledJsxStyleProps {
  children: string;
  jsx?: boolean;
  global?: boolean;
  [key: string]: any; // For any other props
}

const StyledJsxStyle: React.FC<StyledJsxStyleProps> = ({ children, jsx, global, ...rest }) => {
  // Only include data-jsx attribute if jsx is true
  const styleProps: any = { ...rest };
  if (jsx) {
    styleProps['data-jsx'] = '';
  }
  if (global) {
    styleProps['data-jsx-global'] = '';
  }
  
  return <style {...styleProps}>{children}</style>;
};

export default StyledJsxStyle;
