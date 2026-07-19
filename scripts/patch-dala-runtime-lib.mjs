export const replacements = [
  {
    label: "cone_position_exr",
    original: '{id:"cone_position_exr",url:"/images/pos-33.exr"}',
    replacement: '{id:"cone_position_exr",url:"/images/pos-ming-robot-v1.exr"}',
  },
  {
    label: "piramed mobile fallback",
    original: '{id:"piramed",url:u.isDesktop?"/models/py-lod7.glb":"/models/py-monbile.glb"}',
    replacement: '{id:"piramed",url:u.isDesktop?"/models/py-lod7.glb":"/models/py-lod7.glb"}',
  },
  {
    label: "rotation target thresholds",
    original: "_updateRotation(){const e=u.sectionProgress,t=zt(Ut(e,0,1,0,.5*-Math.PI),.5*-Math.PI,0)+zt(Ut(e,2.7,3,0,.5*Math.PI),0,.5*Math.PI)+zt(Ut(e,3.3,3.5,0,.25*Math.PI),0,.25*Math.PI)-zt(Ut(e,4.5,5,0,1.25*Math.PI),0,1.25*Math.PI)+zt(Ut(e,5.7,this.royYEnd,0,Math.PI),0,Math.PI),n=zt(Ut(e,2.7,3,0,-.489),-.489,0)+zt(Ut(e,3.3,3.5,0,.6),0,.6);",
    legacy: [
      "_updateRotation(){const e=u.sectionProgress,t=zt(Ut(e,0,1,0,.5*-Math.PI),.5*-Math.PI,0)+zt(Ut(e,.7,1,0,.5*Math.PI),0,.5*Math.PI)+zt(Ut(e,1.7,2,0,.25*Math.PI),0,.25*Math.PI)-zt(Ut(e,4.5,5,0,1.25*Math.PI),0,1.25*Math.PI)+zt(Ut(e,2.7,3,0,Math.PI),0,Math.PI),n=zt(Ut(e,.7,1,0,-.489),-.489,0)+zt(Ut(e,1.7,2,0,.6),0,.6);",
      "_updateRotation(){const e=u.sectionProgress,t=zt(Ut(e,0,1,0,.5*-Math.PI),.5*-Math.PI,0)+zt(Ut(e,.7,1,0,.5*Math.PI),0,.5*Math.PI)+zt(Ut(e,2.7,3,0,.25*Math.PI),0,.25*Math.PI),n=zt(Ut(e,.7,1,0,-.489),-.489,0)+zt(Ut(e,1.7,2,0,.489),0,.489);",
    ],
    replacement: "_updateRotation(){const e=u.sectionProgress,t=zt(Ut(e,.7,.85,0,.5*Math.PI),0,.5*Math.PI)-zt(Ut(e,.85,1,0,.5*Math.PI),0,.5*Math.PI)+zt(Ut(e,1.7,1.85,0,.25*Math.PI),0,.25*Math.PI)-zt(Ut(e,1.85,2,0,.25*Math.PI),0,.25*Math.PI)+zt(Ut(e,2.7,2.85,0,.25*Math.PI),0,.25*Math.PI)-zt(Ut(e,2.85,3,0,.25*Math.PI),0,.25*Math.PI),n=0;",
  },
  {
    label: "desktop horizontal position",
    original: "const e=u.sectionProgress,t=zt(Ut(e,0,1,3,-4.5),-4.5,3)+zt(Ut(e,1.25,1.5,.905,5),.905,5)-zt(Ut(e,2.8,3,.905,3),.905,3)+zt(Ut(e,3.3,3.5,.905,6),.905,6)-zt(Ut(e,4.5,5,.905,5),.905,4);this._params.basePosition.x",
    replacement: "const e=u.sectionProgress,t=3-zt(Ut(e,.7,1,0,7.4),0,7.4)+zt(Ut(e,1.7,2,0,.8),0,.8)+zt(Ut(e,2.7,3,0,1.1),0,1.1);this._params.basePosition.x",
  },
  {
    label: "desktop vertical position",
    original: "const n=zt(Ut(e,2.7,3,0,.5),0,.5)-zt(Ut(e,3.3,3.5,0,.5),0,.5)+zt(Ut(e,5.7,6,0,1.75),0,1.75);this._params.basePosition.y",
    replacement: "const n=-zt(Ut(e,.7,1,0,.6),0,.6)-zt(Ut(e,1.7,2,0,.8),0,.8)+zt(Ut(e,2.7,3,0,1.9),0,1.9);this._params.basePosition.y",
  },
  {
    label: "desktop particle factor",
    original: "const r=this._factor+zt(Ut(e,0,1,0,1),0,1)-zt(Ut(e,1.25,1.5,0,1),0,1)+zt(Ut(e,3.3,3.5,0,.3),0,.3)-zt(Ut(e,5.7,6,0,1),0,1);this._material.customUniforms[3].value",
    replacement: "const r=this._factor;this._material.customUniforms[3].value",
  },
  {
    label: "desktop target thresholds",
    original: "const o=zt(Ut(e,2.7,3,0,1),0,1)+zt(Ut(e,3.3,3.5,0,1),0,1)+zt(Ut(e,5.7,6,0,1),0,1);this._material.customUniforms[14].value",
    replacement: "const o=zt(Ut(e,.7,1,0,1),0,1)+zt(Ut(e,1.7,2,0,1),0,1)+zt(Ut(e,2.7,3,0,1),0,1);this._material.customUniforms[14].value",
  },
  {
    label: "mobile target thresholds",
    original: "const i=zt(Ut(e,2.7,3,0,1),0,1)+zt(Ut(e,3.3,3.5,0,1),0,1)+zt(Ut(e,5.7,5.8,0,1),0,1);this._material.customUniforms[14].value",
    replacement: "const i=zt(Ut(e,.7,1,0,1),0,1)+zt(Ut(e,1.7,2,0,1),0,1)+zt(Ut(e,2.7,3,0,1),0,1);this._material.customUniforms[14].value",
  },
  {
    label: "desktop explode transitions",
    original: "const i=zt(Ut(e,1.1,2.2,0,1),0,1)-zt(Ut(e,2.8,3,0,1),0,1)+zt(Ut(e,4.5,5,0,1),0,1)-zt(Ut(e,5.7,6,0,1),0,1);this._material.customUniforms[13].value",
    replacement: "const i=zt(Ut(e,.72,.82,0,1),0,1)-zt(Ut(e,.9,1,0,1),0,1)+zt(Ut(e,1.72,1.82,0,1),0,1)-zt(Ut(e,1.9,2,0,1),0,1)+zt(Ut(e,2.72,2.82,0,1),0,1)-zt(Ut(e,2.9,3,0,1),0,1);this._material.customUniforms[13].value",
  },
  {
    label: "mobile explode transitions",
    original: "const n=zt(Ut(e,1.4,1.7,0,1),0,1)-zt(Ut(e,2.7,3,0,1),0,1)+zt(Ut(e,4.5,5,0,1),0,1)-zt(Ut(e,5.7,5.8,0,1),0,1);this._material.customUniforms[13].value",
    replacement: "const n=zt(Ut(e,.72,.82,0,1),0,1)-zt(Ut(e,.9,1,0,1),0,1)+zt(Ut(e,1.72,1.82,0,1),0,1)-zt(Ut(e,1.9,2,0,1),0,1)+zt(Ut(e,2.72,2.82,0,1),0,1)-zt(Ut(e,2.9,3,0,1),0,1);this._material.customUniforms[13].value",
  },
];

export function countOccurrences(value, search) {
  return value.split(search).length - 1;
}

export function patchRuntime(runtime) {
  let patchedRuntime = runtime;

  for (const { label, original, legacy = [], replacement } of replacements) {
    const sources = [original, ...legacy];
    const sourceCounts = sources.map((source) => countOccurrences(patchedRuntime, source));
    const replacementCount = countOccurrences(patchedRuntime, replacement);
    const sourceMatchCount = sourceCounts.reduce((total, count) => total + count, 0);

    if (sourceMatchCount === 1 && replacementCount === 0) {
      const sourceIndex = sourceCounts.findIndex((count) => count === 1);
      patchedRuntime = patchedRuntime.replace(sources[sourceIndex], replacement);
    } else if (sourceMatchCount !== 0 || replacementCount !== 1) {
      throw new Error(
        `Expected ${label} to have exactly one source or one patched target; ` +
          `found ${sourceMatchCount} source and ${replacementCount} patched target occurrences.`,
      );
    }

    const finalCount = countOccurrences(patchedRuntime, replacement);
    if (finalCount !== 1) {
      throw new Error(`Expected exactly one patched ${label} target, found ${finalCount}.`);
    }
  }

  return patchedRuntime;
}
