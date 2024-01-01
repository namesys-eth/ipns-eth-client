import React, { useState, useEffect } from "react";

interface Props {
  height: number,
  width: number
}

const ColorsLoadingIcon: React.FC<Props> = ({ height, width }) => {
  
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 278 278" width="${width}mm" height="${height}mm">
      <defs>
        <path id="J" d="M135.837 210.115l14.22-81.21 14.22 53.652z"/>
        <path id="K" d="M156.045 122.32l14.22 54.14 78.587-76.577z"/>
        <path id="L" d="M140.577 214.749l78.587-76.821 14.47 54.628z"/>
        <path id="M" d="M224.902 132.319l28.69-27.802-14.22 81.942z"/>
      </defs>
      <g transform="translate(35.88 67.413) matrix(2.193452 0 0 2.243876 -323.83206 -281.53944)" fill-rule="evenodd">
        <use xlink:href="#J">
        <animate attributeName="fill" values="#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;" dur="3.3s" repeatCount="indefinite"/>
        </use>
        <use xlink:href="#M">
        <animate attributeName="fill" values="#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;" dur="3.5s" repeatCount="indefinite"/>
        </use>
        <use xlink:href="#K">
        <animate attributeName="fill" values="#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;" dur="3.2s" repeatCount="indefinite"/>
        </use>
        <use xlink:href="#L">
        <animate attributeName="fill" values="#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;#fc003f;#fca400;#fc4c00;#fc0000;" dur="3.6s" repeatCount="indefinite"/>
        </use>
      </g>
    </svg>
  `;
  
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
};

export default ColorsLoadingIcon;
