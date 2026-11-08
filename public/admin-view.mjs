import { escapeHtml } from './render.mjs';

// 테마 버튼: 색 점 + 영문 이름 + 한글 이름 (design/project 프로토타입의 themeList)
export function renderThemeOptions(themes, activeKey) {
  return themes
    .map((theme) =>
      renderOption(
        'theme',
        theme.key,
        theme.key === activeKey,
        `<span class="theme-option-name"><span class="theme-dot" style="background:${escapeHtml(theme.accent)}"></span><span class="theme-label">${escapeHtml(theme.label)}</span></span><span class="theme-ko">${escapeHtml(theme.ko)}</span>`,
      ),
    )
    .join('');
}

// 디바이스 버튼: 이름 + 해상도 (프로토타입의 deviceList)
export function renderDeviceOptions(devices, activeKey) {
  return devices
    .map((device) =>
      renderOption(
        'device',
        device.key,
        device.key === activeKey,
        `<span class="device-label">${escapeHtml(device.label)}</span><span class="device-dim">${device.width} × ${device.height}</span>`,
      ),
    )
    .join('');
}

// 선택 버튼 하나. 선택 상태는 aria-pressed 로 표시해 스타일과 보조기술이 같은 값을 본다.
function renderOption(kind, key, isActive, content) {
  return `<button type="button" class="option ${kind}-option" data-${kind}="${escapeHtml(key)}" aria-pressed="${isActive}">${content}</button>`;
}

// 저장 전 초안을 실제 메뉴 위에 겹쳐 미리보기용 메뉴를 만든다.
export function previewMenu(menu, draft) {
  return { ...menu, ...draft };
}
