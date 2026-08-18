/**
 * Pure Cloud Mode Configuration
 * Portal AutoForm - SMKN 1 Jetis Mojokerto
 * Master data sepenuhnya dikelola via Google Cloud Firestore (tanpa fallback offline)
 */

export const INITIAL_TEACHERS = [];
export const INITIAL_FORMS = [];
export const INITIAL_SCHEDULES = [];

// Format Pilihan Kelas Resmi di Google Form Absen Mengajar
export const FORM_CLASS_OPTIONS = [
  "X  TAV", "X  TEI 1", "X  TEI 2", "X  TPL 1", "X  TPL 2", "X  TPM 1", "X  TPM 2", "X  TKR1", "X  TKR2", "X  TBKR", "X  TSM 1", "X  TSM 2", "X  DKV 1", "X  DKV 2", "X  DKV 3",
  "XI  TAV", "XI  TEI 1", "XI  TEI 2", "XI  TPL 1", "XI  TPL 2", "XI  TPM 1", "XI  TPM 2", "XI  TKR1", "XI  TKR2", "XI  TBKR", "XI  TSM 1", "XI  TSM 2", "XI  DKV 1", "XI  DKV 2", "XI  DKV 3",
  "XII  TAV", "XII  TEI 1", "XII  TEI 2", "XII  TPL 1", "XII  TPL 2", "XII  TPM 1", "XII  TPM 2", "XII  TKR1", "XII  TKR2", "XII  TBKR", "XII  TSM 1", "XII  TSM 2", "XII DKV 1", "XII  DKV 2", "XII  DKV 3"
];

// Master Data Seluruh Kelas Guru
export const ALL_CLASSES = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3",
  "-"
];
