import { vec2, vec3, mat3 } from 'gl-matrix';
import { isImage, isImageBitmap, defineProperties } from '../Util';
import { Trigger } from '../Trigger';
import KeyValue from '../core/KeyValue';

// http://devernay.free.fr/cours/opengl/materials.html
let materialId = 1;

export class Material extends Trigger {
  constructor(options) {
    super();
    let self = this;
    self._id = materialId++;
    self._dirty = true;
    self._key = '';
    self._keys = [];
    self._shadowMapKey = '';
    self._shadowMapkeys = [];
    self._textureScale = vec2.fromValues(1, 1);
    self._textureOffset = vec2.fromValues(0, 0);
    self._textureMatrix = mat3.create();
    self._dirtyTextureMatrix = false;
    self._emissiveColor = vec3.fromValues(1, 1, 1);
    self._wireframeColor = vec3.fromValues(
      69.0 / 255.0,
      132.0 / 255.0,
      206.0 / 255.0
    );
    if (options) {
      self.options = options;
    }
    // self._lods = null;
  }

  set options(options) {
    const self = this;
    Object.keys(options).forEach((key) => {
      self[key] = options[key];
    });
    return self;
  }

  getKey(scene, shadow) {
    let self = this;
    if (self._dirty) {
      let keys = (self._keys = []);
      let shadowMapKeys = (self._shadowMapKeys = []);
      if (self._pointSize > 0) {
        keys.push('POINT');
      }
      if (self._clipPlane) {
        keys.push('CLIPPLANE');
      }
      if (self._flipY) {
        keys.push('FLIP_Y');
      }
      if (self._wireframe) {
        keys.push('WIREFRAME');
        if (self._wireframeOnly) {
          keys.push('WIREFRAME_ONLY');
        }
      }
      if (self._transparent) {
        keys.push('BLEND');
      }
      if (self._alphaTest) {
        keys.push('ALPHA_TEST');
      }
      if (self._gammaInput) {
        keys.push('GAMMA_INPUT');
      }
      if (self._morphTargetsCount) {
        shadowMapKeys.push('MORPH_TARGETS');
        shadowMapKeys.push(
          new KeyValue('MORPH_TARGETS_COUNT', self._morphTargetsCount)
        );
      }
      if (self._jointsCount > 0) {
        shadowMapKeys.push('SKIN');
        shadowMapKeys.push(
          new KeyValue('SKIN_JOINTS_COUNT', self._jointsCount)
        );
      }
      if (!self._wireframe || !self._wireframeOnly) {
        if (self._vertexColor) {
          keys.push('VERTEX_COLOR');
        }
        if (self._light && scene.lights.count) {
          keys.push('LIGHT');
          let lightDefines = scene._lightDefines;
          Object.keys(lightDefines).forEach((lightType) => {
            keys.push(lightDefines[lightType]);
          });
          if (self._normalImage) {
            keys.push('NORMAL_MAP');
          } else if (self._bumpImage) {
            keys.push('BUMP_MAP');
          }
        }
        if (self._emissiveImage) {
          keys.push('EMISSIVE_MAP');
        }
        if (self._shadow && scene._shadow) {
          keys.push('SHADOW');
        }
      }
      if (scene._enableFog) {
        keys.push('FOG');
      }
      shadowMapKeys.forEach((key) => {
        keys.push(key);
      });
      self._shadowMapKey = shadowMapKeys.join(',');
    }
    return shadow ? self._shadowMapKey : self._key;
  }

  _bindUniforms(uniforms, gl, scene) {
    let self = this;
    gl._material = self;
    uniforms.u_textureMatrix = self.textureMatrix;
    uniforms.u_wireframeColor = self.wireframeColor;
    uniforms.u_wireframeWidth = self.wireframeWidth;
    uniforms.u_wireframeOnly = self.wireframeOnly;
    uniforms.u_clipPlane = self.clipPlane;
    uniforms.u_emissiveColor = self.emissiveColor;
    uniforms.u_transparency = self.transparency;
    uniforms.u_pointSize = self.pointSize;
    uniforms.u_bumpScale = self.bumpScale;

    if (self._alphaTest) {
      uniforms.u_alphaCutoff = self.alphaCutoff;
    }

    if (gl._transparent) {
      scene._setBlendMode(
        self.blendEquationColor,
        self.blendEquationAlpha,
        self.blendFuncSrcColor,
        self.blendFuncDstColor,
        self.blendFuncSrcAlpha,
        self.blendFuncDstAlpha
      );
    }

    scene._setCullFace(!self.doubleSided);

    if (self._normalImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._normalImage).bind(gl, samplerId);
      uniforms.u_normalSampler = samplerId;
    } else if (self._bumpImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._bumpImage).bind(gl, samplerId);
      uniforms.u_bumpSampler = samplerId;
    }
    if (self._emissiveImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._emissiveImage, true).bind(gl, samplerId);
      uniforms.u_emissiveSampler = samplerId;
    }
  }

  _resetBlendMode() {
    let self = this,
      blendMode = self._blendMode,
      premultipliedAlpha = self._premultipliedAlpha,
      blendEquationColor,
      blendEquationAlpha,
      blendFuncSrcColor,
      blendFuncSrcAlpha,
      blendFuncDstColor,
      blendFuncDstAlpha;
    if (blendMode === 'normal') {
      if (premultipliedAlpha) {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'ONE';
        blendFuncDstColor = 'ONE_MINUS_SRC_ALPHA';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE_MINUS_SRC_ALPHA';
      } else {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'SRC_ALPHA';
        blendFuncDstColor = 'ONE_MINUS_SRC_ALPHA';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE_MINUS_SRC_ALPHA';
      }
    } else if (blendMode === 'additive') {
      if (premultipliedAlpha) {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'ONE';
        blendFuncDstColor = 'ONE';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE';
      } else {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'SRC_ALPHA';
        blendFuncDstColor = 'ONE';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE';
      }
    } else if (blendMode === 'multiply') {
      if (premultipliedAlpha) {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'ZERO';
        blendFuncDstColor = 'SRC_COLOR';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE';
      } else {
        blendEquationColor = blendEquationAlpha = 'FUNC_ADD';
        blendFuncSrcColor = 'ZERO';
        blendFuncDstColor = 'SRC_COLOR';
        blendFuncSrcAlpha = 'ONE';
        blendFuncDstAlpha = 'ONE';
      }
    }
    self._blendEquationColor = WebGLRenderingContext[blendEquationColor];
    self._blendEquationAlpha = WebGLRenderingContext[blendEquationAlpha];
    self._blendFuncSrcColor = WebGLRenderingContext[blendFuncSrcColor];
    self._blendFuncSrcAlpha = WebGLRenderingContext[blendFuncSrcAlpha];
    self._blendFuncDstColor = WebGLRenderingContext[blendFuncDstColor];
    self._blendFuncDstAlpha = WebGLRenderingContext[blendFuncDstAlpha];
  }
  /*
  addLOD (distance, material) {
    let self = this,
      lods = self._lods,
      newLod = {
        distance: distance,
        material: material
      };
    // TODO how to handle lod property change
    if (!lods) {
      self._lods = [newLod];
    } else {
      // big first, small last
      let n = lods.length - 1;
      let lod = lods[n];
      if (distance <= lod.distance) {
        lods.push(newLod);
      } else {
        for (let i = 0; i <= n; i++) {
          lod = lods[i];
          if (distance >= lod.distance) {
            lods.splice(i, 0, newLod);
            break;
          }
        }
      }
    }
    self.fire({
      type: 'change',
      data: self,
      property: 'lod',
      oldValue: lods,
      newValue: lods
    });
  }

  removeLOD (material) {
    let self = this,
      lods = self._lods;
    if (!lods) {
      return;
    }
    for (let i = lods.length - 1; i >=0; i--) {
      let lod = lods[i];
      if (lod.material === material) {
        lods.splice(i, 1);
        break;
      }
    }
    if (!lods.length) {
      self._lods = null;
    }
    self.fire({
      type: 'change',
      data: self,
      property: 'lod',
      oldValue: lods,
      newValue: lods
    });
  } */
}

function convertBlendValue(value) {
  if (typeof value === 'string') {
    return WebGLRenderingContext[value];
  }
  return value;
}

Material._textureConverter = function (value) {
  if (typeof value === 'string' || isImage(value) || isImageBitmap(value)) {
    return {
      url: value,
    };
  }
  return value;
};

defineProperties(Material.prototype, [
  {
    name: 'emissiveColor',
  },
  {
    name: 'emissiveImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'doubleSided',
    value: false,
  },
  {
    name: 'transparency',
    value: 1.0,
  },
  {
    name: 'transparent',
    value: false,
    dirty: '_dirty',
  },
  {
    name: 'gammaInput',
    value: false,
    dirty: '_dirty',
  },
  {
    name: 'alphaTest',
    value: false,
    dirty: '_dirty',
  },
  {
    name: 'alphaCutoff',
    value: 0.5,
  },
  {
    name: 'flipY',
    value: true,
    dirty: '_dirty',
  },
  // normal, additive, multiply, custom
  {
    name: 'blendMode',
    value: 'normal',
    callback(oldValue, newValue) {
      this._resetBlendMode();
    },
  },
  {
    name: 'premultipliedAlpha',
    value: false,
    callback(oldValue, newValue) {
      this._resetBlendMode();
    },
  },
  {
    name: 'blendEquationColor',
    value: WebGLRenderingContext.FUNC_ADD,
    converter: convertBlendValue,
  },
  {
    name: 'blendEquationAlpha',
    value: WebGLRenderingContext.FUNC_ADD,
    converter: convertBlendValue,
  },
  {
    name: 'blendFuncSrcColor',
    value: WebGLRenderingContext.SRC_ALPHA,
    converter: convertBlendValue,
  },
  {
    name: 'blendFuncSrcAlpha',
    value: WebGLRenderingContext.ONE,
    converter: convertBlendValue,
  },
  {
    name: 'blendFuncDstColor',
    value: WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
    converter: convertBlendValue,
  },
  {
    name: 'blendFuncDstAlpha',
    value: WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
    converter: convertBlendValue,
  },
  {
    name: 'light',
    value: true,
    dirty: '_dirty',
  },
  {
    name: 'clipPlane',
    value: null,
    dirty: '_dirty',
  },
  {
    name: 'wireframe',
    value: false,
    dirty: '_dirty',
  },
  {
    // TODO: if wireframeOnly is true, must set transparent to true
    name: 'wireframeOnly',
    value: true,
    dirty: '_dirty',
  },
  {
    name: 'wireframeColor',
  },
  {
    name: 'wireframeWidth',
    value: 1.0,
  },
  {
    name: 'vertexColor',
    value: false,
    dirty: '_dirty',
  },
  {
    name: 'normalImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'bumpImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'bumpScale',
    value: 1.0,
  },
  {
    name: 'morphTargetsCount',
    value: 0,
    dirty: '_dirty',
  },
  {
    name: 'jointsCount',
    value: 0,
    dirty: '_dirty',
  },
  {
    name: 'shadow',
    value: true,
    dirty: '_dirty',
  },
  {
    name: 'pointSize',
    value: 0,
    dirty: '_dirty',
  },
  {
    name: 'textureScale',
    dirty: '_dirtyTextureMatrix',
  },
  {
    name: 'tsx',
    get() {
      return this.textureScale[0];
    },
    set(value) {
      this.textureScale[0] = value;
      this.textureScale = this.textureScale;
    },
  },
  {
    name: 'tsy',
    get() {
      return this.textureScale[1];
    },
    set(value) {
      this.textureScale[1] = value;
      this.textureScale = this.textureScale;
    },
  },
  {
    name: 'textureOffset',
    dirty: '_dirtyTextureMatrix',
  },
  {
    name: 'tx',
    get() {
      return this.textureOffset[0];
    },
    set(value) {
      this.textureOffset[0] = value;
      this.textureOffset = this.textureOffset;
    },
  },
  {
    name: 'ty',
    get() {
      return this.textureOffset[1];
    },
    set(value) {
      this.textureOffset[1] = value;
      this.textureOffset = this.textureOffset;
    },
  },
  {
    name: 'textureRotation',
    value: 0,
    dirty: '_dirtyTextureMatrix',
  },
  {
    name: 'textureMatrix',
    noSet: true,
    get() {
      let self = this,
        textureMatrix = self._textureMatrix;
      if (self._dirtyTextureMatrix) {
        mat3.fromTranslation(textureMatrix, self._textureOffset);
        mat3.rotate(textureMatrix, textureMatrix, -self._textureRotation);
        mat3.scale(textureMatrix, textureMatrix, self._textureScale);
      }
      return textureMatrix;
    },
  },
]);
