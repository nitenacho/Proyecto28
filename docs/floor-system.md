# Sistema de pisos y ascenso

Proyecto28 v0.26.0 convierte el mini-juego de luz en una experiencia por
pisos: la luz/personaje come esferas, genera una escalera y la camara simula
subir a un nivel superior mientras el piso anterior queda visible como fondo.

## Flujo jugable

1. El usuario toma control de la luz desde el HUD.
2. `createCollectibleSpheres` activa esferas pequenas sobre cubos vacios.
3. Al recolectar `gameAscendSphereGoal` esferas, se ocultan las esferas y
   `createFloorSystem.startAscension()` muestra una escalera luminosa.
4. La camara levanta su objetivo durante una transicion vertical breve.
5. El piso anterior se conserva como una version simplificada en el fondo.
6. El HUD sube `Piso` y reinicia el contador de esferas para el nuevo nivel.

## InstancedMesh / Grid Ventana

Los pisos anteriores no duplican cubos completos ni materiales complejos. Se
representan con `THREE.InstancedMesh` de cajas bajas en wireframe:

- una geometria compartida por piso anterior;
- un material `MeshBasicMaterial` transparente;
- matrices por tile copiadas desde la grilla actual;
- escala y opacidad decrecientes por profundidad.

Este enfoque deja visible la memoria del piso anterior sin multiplicar draw
calls ni mantener texturas/iframes/popups por nivel. Por defecto se conservan
3 pisos anteriores y Strapi limita el valor a `1..4`.

## Matematica visual

`scene.setCameraAscentOffset(offset)` desplaza el objetivo y la posicion de la
camara en Y. Durante la etapa `stair`, el offset sube hasta `0.85` para dar
anticipacion. Durante `ascend`, el offset usa una campana suave
`sin(progress * PI) * 1.35 + (1 - progress) * 0.85`, de modo que el mundo
parece bajar mientras el jugador sube.

El piso fantasma mas reciente baja desde `0` hasta `-gameFloorHeight`, reduce
escala hasta `0.86` y baja opacidad. Los pisos mas antiguos se reordenan con
profundidad adicional, escala menor y opacidad mas baja para simular niebla.

## Configuracion Strapi / Tweaks

`SiteSetting` expone estos campos:

- `gameAscendSphereGoal`: entero `1..18`, recomendado `6`.
- `gameFloorHeight`: decimal `2.8..7.5`, recomendado `4.2`.
- `gameGhostFloors`: entero `1..4`, recomendado `3`.

En el frontend viven en `Admin -> Tweaks -> Juego` y son publicables igual que
los otros ajustes del juego. El fallback local usa los mismos defaults.

## QA

Con `?floor-test=...` o en dev se expone `window.p28FloorDebug`:

```js
window.p28FloorDebug.state()
window.p28FloorDebug.triggerAscension()
```

Senales esperadas:

- antes: `ascensionState="idle"`, `floorLevel=0`, `ghostCount=0`;
- al disparar: `ascensionState="stair"`, `stairVisible=true`,
  `ghostCount=1`;
- durante: `ascensionState="ascend"`, `cameraLift>0`;
- final: `ascensionState="idle"`, `floorLevel=1`, `stairVisible=false`.

Tambien quedan datasets en `document.documentElement.dataset`:

- `p28FloorLevel`
- `p28FloorLevelNext`
- `p28FloorSphereGoal`
- `p28StairVisible`
- `p28AscensionState`

## Recomendaciones de performance

- Mantener `gameGhostFloors` en `3` para produccion.
- No renderizar contenido CMS/popup/streaming en pisos anteriores.
- Usar solo wireframe transparente para profundidad, sin sombras.
- Conservar el ascenso como transicion corta: mas claridad que simulacion
  fisica larga.
- Si se agregan niveles con reglas propias, mantener el piso activo como la
  unica grilla interactiva y tratar pisos anteriores como decoracion barata.
