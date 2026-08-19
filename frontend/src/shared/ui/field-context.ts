import { createContext, useContext } from 'react';

// Field.required를 하위 폼 컨트롤로 전달하는 컨텍스트.
// FieldLabel의 필수 dot은 aria-hidden이라 보조기기에 안 닿으므로, 각 컨트롤(Input/Select/토글/휠)이
// 이 값을 읽어 자기 포커스 요소에 aria-required를 붙이는 게 필수 정보 전달의 단일 경로다.
export const FieldRequiredContext = createContext(false);

/** 상위 Field가 required인지. 폼 컨트롤이 aria-required를 스스로 붙일 때 쓴다. */
export const useFieldRequired = (): boolean => useContext(FieldRequiredContext);
