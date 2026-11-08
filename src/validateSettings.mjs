export function validateSettings(input, { themes, devices, sheets }) {
  const errors = {};
  const store = String(input.store ?? '');
  const tagline = String(input.tagline ?? '');
  const autoRotateSec = Number(input.autoRotateSec);
  const displaySheet = String(input.displaySheet ?? '');
  if (store.length > 100) errors.store = '매장명은 100자 이하로 입력하십시오.';
  if (tagline.length > 100) errors.tagline = '영문태그는 100자 이하로 입력하십시오.';
  if (!themes.includes(input.theme)) errors.theme = '목록에 있는 테마를 고르십시오.';
  if (!devices.includes(input.device)) errors.device = '목록에 있는 디바이스를 고르십시오.';
  if (!Number.isInteger(autoRotateSec) || autoRotateSec < 0 || autoRotateSec > 3600)
    errors.autoRotateSec = '자동전환초는 0~3600 사이 정수로 입력하십시오.';
  if (displaySheet !== '' && !sheets.includes(displaySheet)) errors.displaySheet = '워크북에 있는 시트를 고르십시오.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { store, tagline, theme: input.theme, device: input.device, autoRotateSec, displaySheet } };
}
