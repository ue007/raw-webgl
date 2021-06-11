// https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_materials_common
import { vec3, vec4 } from 'gl-matrix';
import { defineProperties } from '../Util';
import { DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER } from '../core/Shader';
import { Material } from './Material';

export class STDMaterial extends Material {
  constructor(options) {
    super(options);
    let self = this;
    if (!self._ambientColor) {
      self._ambientColor = vec3.fromValues(1, 1, 1);
    }
    if (!self._diffuseColor) {
      self._diffuseColor = vec4.fromValues(1, 1, 1, 1);
    }
    if (!self._specularColor) {
      self._specularColor = vec3.fromValues(1, 1, 1);
    }
  }

  getKey(scene, shadow) {
    let self = this;
    if (self._dirty) {
      super.getKey(scene, shadow);
      self._dirty = false;
      let keys = self._keys;
      if (!self._wireframe || !self._wireframeOnly) {
        if (self._diffuseImage) {
          if (self._diffuseImage.type === 'CUBE_MAP') {
            keys.push('DIFFUSE_CUBE_MAP');
          } else {
            keys.push('DIFFUSE_MAP');
          }
        }
        if (self._envImage) {
          keys.push('ENV_MAP');
          if (self._refractive) {
            keys.push('REFRACTIVE');
          }
        }
        if (self._light && scene.lights.count) {
          if (self._ambientImage) {
            keys.push('AMBIENT_MAP');
          }
          if (self._specularImage) {
            keys.push('SPECULAR_MAP');
          }
        }
      }
      self._key = `${self.TYPE},${keys.join(',')}`;
    }
    return shadow ? self._shadowMapKey : self._key;
  }

  _bindUniforms(uniforms, gl, scene) {
    let self = this;
    super._bindUniforms(uniforms, gl, scene);

    uniforms.u_ambientColor = self._ambientColor;
    uniforms.u_diffuseColor = self.diffuseColor;
    uniforms.u_specularColor = self.specularColor;
    uniforms.u_shininess = self.shininess;

    if (self._diffuseImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._diffuseImage, true).bind(gl, samplerId);
      uniforms.u_diffuseSampler = samplerId;
    }
    if (self._ambientImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._ambientImage).bind(gl, samplerId);
      uniforms.u_ambientSampler = samplerId;
    }
    if (self._specularImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._specularImage).bind(gl, samplerId);
      uniforms.u_specularSampler = samplerId;
    }
    if (self._envImage) {
      const samplerId = uniforms._nextSamplerId++;
      gl.cache.textures.get(self._envImage, true).bind(gl, samplerId);
      uniforms.u_envSampler = samplerId;
    }
  }
}

export const DEFAULT_MATERIAL = new STDMaterial();

STDMaterial.prototype.TYPE = 'STD';
STDMaterial.prototype.VERTEX_SHADER = DEFAULT_VERTEX_SHADER;
STDMaterial.prototype.FRAGMENT_SHADER = DEFAULT_FRAGMENT_SHADER;

defineProperties(STDMaterial.prototype, [
  {
    name: 'ambientColor',
  },
  {
    name: 'ambientImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'diffuseColor',
  },
  {
    name: 'diffuseImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'specularColor',
  },
  {
    name: 'specularImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'shininess',
    value: 64.0,
  },
  {
    name: 'envImage',
    value: null,
    dirty: '_dirty',
    converter: Material._textureConverter,
  },
  {
    name: 'refractive',
    value: false,
    dirty: '_dirty',
  },
]);
