'use client';

import { useEffect } from 'react';

export function DatawrapperChart() {
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(){"use strict";window.addEventListener("message",(function(a){if(void 0!==a.data["datawrapper-height"]){var e=document.querySelectorAll("iframe");for(var t in a.data["datawrapper-height"])for(var r=0;r<e.length;r++)if(e[r].contentWindow===a.source){var i=a.data["datawrapper-height"][t]+"px";e[r].style.height=i}}}))}();
    `;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full">
      <iframe 
        title="Gen AI" 
        aria-label="Map" 
        id="datawrapper-chart-BZl7I" 
        src="https://datawrapper.dwcdn.net/BZl7I/2/" 
        scrolling="no" 
        frameBorder="0" 
        style={{ width: "0", minWidth: "100% !important", border: "none" }}
        height="725"
        data-external="1"
      />
    </div>
  );
} 