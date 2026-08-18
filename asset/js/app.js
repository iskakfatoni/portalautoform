/**
 * PORTAL:AutoForm - Multi-User Cloud Application
 * Integrasi Firebase Auth, Cloud Firestore, Personal URL Routing (?nip=...), dan Import/Export Engine
 */

import {
  initFirebase,
  auth,
  db,
  getDb,
  googleProvider,
  isFirebaseActive,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from './firebase-config.js';

// Master Data Awal (Daftar Lengkap 92 Guru Beserta NIP dan Link Google Form Jurnal Mengajar Masing-Masing)
const INITIAL_TEACHERS = [
  {
    "orderIndex": 1,
    "name": "HERMAWANTO, S.Pd., M.Psi",
    "nip": "196706281992031005",
    "class": "X TAV",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfkbps0npjehTlYmsKU0-Wk0asBRldMI6Le293RIrT1S-JLvg/viewform"
  },
  {
    "orderIndex": 2,
    "name": "NURUL HIDAYATI, S.Pd., M.Psi",
    "nip": "197004301998022004",
    "class": "X TEI 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeN20MexbrBL34C2Q686_fkiIwRRd1p8MlfQmirZxcd7z32gA/viewform"
  },
  {
    "orderIndex": 3,
    "name": "Drs. MOEHAIMIN",
    "nip": "196709041997031005",
    "class": "X TEI 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSez4gjTar2bPbopGm6ErVaBlugek0rGtLocS5azfCCp0MDSIA/viewform"
  },
  {
    "orderIndex": 4,
    "name": "DHURROTUL FARIDAH, S.Pd",
    "nip": "196707142006042005",
    "class": "X TPL 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeMVWzzDZ53AHLlhGUhchbGtjSPh774mpA2M0nanLr8yfuENQ/viewform"
  },
  {
    "orderIndex": 5,
    "name": "SRI WINARTI, S.Pd",
    "nip": "197307112007012008",
    "class": "X TPL 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeDax_Aw_bF0ozmHf2395mK0_9K9QaIgPxKL3Msw8FyZrsKJw/viewform"
  },
  {
    "orderIndex": 6,
    "name": "MUNASRI, S.Pd.",
    "nip": "197003282008012013",
    "class": "X TPM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfb21fBd9nBHkgM2MBTbSNxfeTgWiXbFL43E9QIZX-zGLzq0g/viewform"
  },
  {
    "orderIndex": 7,
    "name": "NUR HAYATI, S.Psi, M.Pd.",
    "nip": "197310152009012003",
    "class": "X TPM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeD8S_m6otgqVphxM7Ux4fGC0wrPh7aPQIKMKg_uaW5tKl42w/viewform"
  },
  {
    "orderIndex": 8,
    "name": "DWI RETNO TUGAS ERNAWATI, S.Pd",
    "nip": "196702142008012009",
    "class": "X TKR1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSe-IzLFr71Gdhgd06mjpg2ToTRv1yEa_u8WYc9JsSpikG-NuA/viewform"
  },
  {
    "orderIndex": 9,
    "name": "KASIATIN, S.Pd",
    "nip": "196908112007012019",
    "class": "X TKR2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSf3zl2VpfYKhir9CPBloLYg_xU95VEOzo28tGm9RxY8hWf_8Q/viewform"
  },
  {
    "orderIndex": 10,
    "name": "SUHARTO DWI SUHERNOWO, ST",
    "nip": "197803262009011007",
    "class": "X TBKR",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdEgJQrGVluy9utuyyeyZ7psIgxX5H9-OTYUG63if-14TLXNg/viewform"
  },
  {
    "orderIndex": 11,
    "name": "ARSYL NOVA ARIRI, ST, M.Pd.",
    "nip": "197811142009012007",
    "class": "X TSM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeYIRHhpNjh1FmGBMMlPQPwu6jnRfYLe__qCNtcIES7ZefQvQ/viewform"
  },
  {
    "orderIndex": 12,
    "name": "LAILA FITRIYA, S.Pd.I",
    "nip": "198506172009012006",
    "class": "X TSM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfLY_MCLONnsdcq8EWaQayXJZ8_9cAWE7IYKvdeEhm2S0GL9A/viewform"
  },
  {
    "orderIndex": 13,
    "name": "EKA PRAMITASARI, S.Pd. M.Pd.",
    "nip": "198710302010012005",
    "class": "X DKV 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdFNOjWRONIbFscUAVy_gPYaD8c1ehSpS2dTykzwJAn_RUDGw/viewform"
  },
  {
    "orderIndex": 14,
    "name": "MISBAHUR ROSYIDIN, S.Pd.",
    "nip": "196802112008011008",
    "class": "X DKV 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSe7MHsr1k2S6apY2TP7L_VulJ7MaQqcKaEsASfOrFV2WfDKSw/viewform"
  },
  {
    "orderIndex": 15,
    "name": "Dra. DYAH CHUSNUL CHOTIMAH",
    "nip": "196802142007012016",
    "class": "X DKV 3",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScl7wa5Pd4jitd3sxqnpqk8tlBpTw-Bx1jl50JwfjGXK_v6ZQ/viewform"
  },
  {
    "orderIndex": 16,
    "name": "WAWAN SISWANTO, SS",
    "nip": "196904012007011025",
    "class": "XI TAV",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdYaU-G7gAyHPvwtYTw67xI_BcR43imBjiP3RB58jOjnU1XeQ/viewform"
  },
  {
    "orderIndex": 17,
    "name": "R.A. RATNA KARTIKAWATI, S.Pd",
    "nip": "196905132008012023",
    "class": "XI TEI 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSd2bLbWa9Pca9QT7JTzZAnSSDZOakUabHJxB_JnNT3CQEv4gA/viewform"
  },
  {
    "orderIndex": 18,
    "name": "HERI SUBYANTORO, ST, M.Pd.",
    "nip": "196910102008011021",
    "class": "XI TEI 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdHmC5tO01PGYfeU-it6vioHYot6MO4Enq9Nbw1oA8DLgGJog/viewform"
  },
  {
    "orderIndex": 19,
    "name": "NURUL HUDA, ST, M.Si.",
    "nip": "197102162008011009",
    "class": "XI TPL 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSd4Etrlv7kK9gUfKVu1OwwyBhjLAn4-l3PArWhzLxF13MmmVw/viewform"
  },
  {
    "orderIndex": 20,
    "name": "NUR 'AFIIFAH, M.Pd.",
    "nip": "197208052007012020",
    "class": "XI TPL 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScZ2l8R4TTNeJdfXVZvYAgc3WGgT9QtEVz0-ANUsebuRgsWsQ/viewform"
  },
  {
    "orderIndex": 21,
    "name": "TRIBUDI HARTONO, S.Pd",
    "nip": "197511052003121004",
    "class": "XI TPM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdcvHzA1p4OhUC9iXA97o8okqRsjziPMeWoPw6g-Nvt7Pr9jg/viewform"
  },
  {
    "orderIndex": 22,
    "name": "DEDY HENDRIANA, S.Pd. M.Pd.",
    "nip": "197904072010011002",
    "class": "XI TPM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSecBLlEDfTwutpIfoRhoxlk9TykVgqtywzFBczl8dG7w3nLgg/viewform"
  },
  {
    "orderIndex": 23,
    "name": "AGUS HIDAYAT, S.Pd",
    "nip": "196907272007011018",
    "class": "XI TKR1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSf4cLrLtqJrSQCZlTZvjVDTqCqwr0Ezvo9jj1xlEEVIA1TgLQ/viewform"
  },
  {
    "orderIndex": 24,
    "name": "SAMSUL HADI, M.Pd.",
    "nip": "197509262008011011",
    "class": "XI TKR2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdoHRTHs-yCXOAaQukleNcx5jWI79dOK6qbeeCW4p45bJ9CLg/viewform"
  },
  {
    "orderIndex": 25,
    "name": "HISBULLOH HUDA, M.Pd.",
    "nip": "197602072010011006",
    "class": "XI TBKR",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSftHQdc5-VZ5uwLLimFvRnkwycT7Ys50sjgRzMN-ALHGSjCqA/viewform"
  },
  {
    "orderIndex": 26,
    "name": "DWI SANTOSO, S.Pd",
    "nip": "197908082006041019",
    "class": "XI TSM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSc3pPlG2fg8z9mrKutplhHQxr-oLEDr0OrG2tbckE403avEiw/viewform"
  },
  {
    "orderIndex": 27,
    "name": "AGUS HARIYANTO, ST. M.Pd",
    "nip": "198010032010011010",
    "class": "XI TSM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfNEYg6DAPuUemLNfKalqh5_nN6m2oxlOxSvPG1Fu55a4gqNA/viewform"
  },
  {
    "orderIndex": 28,
    "name": "ZAINUL ARIFIN, M.Pd.",
    "nip": "198210112010011009",
    "class": "XI DKV 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSc1knrp09uNEhFpIHg2HnTVcw1HE0-aoR7bacYb4cXIsHAleQ/viewform"
  },
  {
    "orderIndex": 29,
    "name": "BAMBANG SUJATMIKO, S.Pd",
    "nip": "198211222006041009",
    "class": "XI DKV 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdYyOzS9TUnTH79m-niYDGHWqxmhbtWyxFehMM6Td06hqBh1A/viewform"
  },
  {
    "orderIndex": 30,
    "name": "HARTONO, S.Pd",
    "nip": "198205122009011009",
    "class": "XI DKV 3",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSczcB1-HoNbq4XLNVL6d22ps_sHXrr_yAMrTdi-SXUI9dyDiA/viewform"
  },
  {
    "orderIndex": 31,
    "name": "SIGIT EKO PRAMONO, S.Pd",
    "nip": "198301122009011006",
    "class": "XII TAV",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdRlmK9kl1qIAOcGpf1Uu18upIQ0GWK8VkTv12k_6AEAERRMQ/viewform"
  },
  {
    "orderIndex": 32,
    "name": "AGUNG RAKHMANDA, S.Kom.",
    "nip": "198303272009031002",
    "class": "XII TEI 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSe3WNA-vHAA16POkCpcvBUl2Kc57HtjVXCkAQEm_mMB69NPow/viewform"
  },
  {
    "orderIndex": 33,
    "name": "MOHAMAD ARIEF PRIYO UTOMO, S.Pd",
    "nip": "198209292010011011",
    "class": "XII TPL 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdPW1l4LaclpGdRqS2jqaCtnP9mivQff9TM2a9if71auoCj6g/viewform"
  },
  {
    "orderIndex": 34,
    "name": "Dr. RIRIN DIYANNITA SASANTI, M.Pd.",
    "nip": "198212022014062003",
    "class": "XII TPL 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSejtfmzSD3f24E8Z4AXVPgC0RTs8brRuZ_KCxV9-lmsq4C5iQ/viewform"
  },
  {
    "orderIndex": 35,
    "name": "SULIADI, S.Pd",
    "nip": "198403262010011008",
    "class": "XII TPM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdaT-LhGEwSzPtm9G3LL6KRs-gFmbNF2uiIykR7J7HDmdC2uQ/viewform"
  },
  {
    "orderIndex": 36,
    "name": "TUTIK QOMARIYAH, S.Si",
    "nip": "198504032010012014",
    "class": "XII TPM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdFjcTg73409mYsq9RTVwH8IBBBz5ya0_y6K1t74WjfpPWMhA/viewform"
  },
  {
    "orderIndex": 37,
    "name": "IMAM SUFERI, ST.",
    "nip": "197712302008011013",
    "class": "XII TKR1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSe8sSOVeefXvVkHVMUzrTdYO8RrfqdFwT5AQRWWlJ3ZzJAluQ/viewform"
  },
  {
    "orderIndex": 38,
    "name": "FIRMAN ARDIANSYAH, S.Pd.",
    "nip": "198706172011011010",
    "class": "XII TKR2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScUo8DXP3Tp38IveX-Bq5eu4aD3aJBRVAjTA8896rGx1WUsNQ/viewform"
  },
  {
    "orderIndex": 39,
    "name": "AZIZ CAHYA PRADANA, S.Pd.",
    "nip": "199103072019031014",
    "class": "XII TBKR",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScKk6RYj6qkwSYwir5SH2zma20b5qhM4boLx8UqeQ19DUTIfA/viewform"
  },
  {
    "orderIndex": 40,
    "name": "WAHYU ROFIUL AMIN, S.Pd.",
    "nip": "199311072019031004",
    "class": "XII TSM 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSczNF2YAQXf9165kZ-FthvzailwmMrM-uSTecJzWHq0JCEldQ/viewform"
  },
  {
    "orderIndex": 41,
    "name": "ROHMA EKA INDRI AHADIAH, S.Pd, Gr",
    "nip": "199410092019032012",
    "class": "XII TSM 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScK_Fn5phDHlhyiBBBWJCXbly98uhXuUeDJI8SvpUkG7rVDOA/viewform"
  },
  {
    "orderIndex": 42,
    "name": "EFRIDA ISBANDRIYAH, S.T.",
    "nip": "199511062019032010",
    "class": "XII DKV 1",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSf4Z31ED-5m9YP8u3CbOt0PWt94nwzJafZSig17a3DoqRlpCQ/viewform"
  },
  {
    "orderIndex": 43,
    "name": "SOTYA BAYUNTARA, S.Pd.",
    "nip": "196906252022211004",
    "class": "XII DKV 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdwaCYi61FdUUCDjn3mXAV6GKexgFlYoZgo-vf_JhnDJWZFyQ/viewform"
  },
  {
    "orderIndex": 44,
    "name": "SRIGATI, SE",
    "nip": "197505052022212013",
    "class": "XII DKV 3",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfFWBI_dGdSFaSy9f7QnJpSPQD8ArZ5DWF08v2sXfUtCf9vNg/viewform"
  },
  {
    "orderIndex": 45,
    "name": "HARI PURWANTO, ST",
    "nip": "197711242022211006",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSc0YfQN7C3oqM_e_gkF-IHzItqHHrH06SNEgwoteprcY9u3Fw/viewform"
  },
  {
    "orderIndex": 46,
    "name": "ESTI WIDHIARNI, S.T",
    "nip": "197906032022212022",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScjOVIF4Br99MIEOWVROsGlzRdhA3fblU_WANEmzYffGpUlxw/viewform"
  },
  {
    "orderIndex": 47,
    "name": "MUCHAMAD ISKAK FATONI, S.Pd.",
    "nip": "198109092022211004",
    "class": "XII TEI 2",
    "role": "Walikelas",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
  },
  {
    "orderIndex": 48,
    "name": "EKO FAJAR KURNIAWAN, S.Pd",
    "nip": "198212102022211017",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSc0NlfwB6ZuoqiE6ScJiGrPeB-Qam31S7PDjICgFf5MPdIkiw/viewform"
  },
  {
    "orderIndex": 49,
    "name": "ETIK SULISTYOWATI, S.Pd.",
    "nip": "198304282022212026",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdUwe7or4Y0G1-MxBUlVlO5CHIQU7My-9_OxXNA87sJhdXBZA/viewform"
  },
  {
    "orderIndex": 50,
    "name": "NOVAN EKO SETYAWAN, S.Kom.",
    "nip": "198404192022211018",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/5ukkAKPa1f6AFkZc7"
  },
  {
    "orderIndex": 51,
    "name": "YAYUK NURNANINGSIH, S.Pd",
    "nip": "198607052022212052",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/55GCWMt4rvFq8Tpl9"
  },
  {
    "orderIndex": 52,
    "name": "KHOIRUL AMIN, S.Pd",
    "nip": "198701192022211009",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfm6LdDpeLyDCvK_EBRBQAFn2KZzRu1O2RcuNEeS-rXHm5ARQ/viewform"
  },
  {
    "orderIndex": 53,
    "name": "REZA ZULKARNAIN ARIFIN, S.Pd.",
    "nip": "198712072022211015",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdCbU4OVvmv8Y1juU-PWfd0aLqXc9SPgcVze8F8GqeYZXpYEw/viewform"
  },
  {
    "orderIndex": 54,
    "name": "KHOIRUZEN, ST",
    "nip": "197107222023211002",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSch1k6AMaxaF6RHrG1J7kyOQfurlM7pv6Zfg2K8H3X94whrPA/viewform"
  },
  {
    "orderIndex": 55,
    "name": "HEPPY LUCKITO, SST",
    "nip": "198110272023211008",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfKzYb7Tb1GQICmf-UOYUp99-MdQogm7IRxd3BN88zTRcftmA/viewform"
  },
  {
    "orderIndex": 56,
    "name": "SRI PURWANINGSIH, S.Pd",
    "nip": "198203022023212020",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSciUprlTkbnMdDIkcOoeZN_KuWUcVafGVknPqPgIZNqrfjo-A/viewform"
  },
  {
    "orderIndex": 57,
    "name": "DARIS UMAMI, S.Pd.",
    "nip": "198205042023212026",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/JSRwHajfSJNBKxr9"
  },
  {
    "orderIndex": 58,
    "name": "AKHMAD ROFI SAFUAT, S.Pd.",
    "nip": "198808072023211018",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/wDAYP8evmdZCEvHr7"
  },
  {
    "orderIndex": 59,
    "name": "SIDHARTHA BUDI SUMEDHA, S.Pd",
    "nip": "199410282023211012",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeyOibEzsSXoKuudKE99ynaPyji9xnu894iTgezdD34JzKmJg/viewform"
  },
  {
    "orderIndex": 60,
    "name": "ASYITAH  ALMUFIDAH, S.Pd",
    "nip": "199606142023212026",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/byFX3UbYfSVMGRUx5"
  },
  {
    "orderIndex": 61,
    "name": "SUDARMONO, ST",
    "nip": "197206202024211005",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/1DCZSoKurcAwXyia8"
  },
  {
    "orderIndex": 62,
    "name": "ROHMAN, S.T.",
    "nip": "197509042024211002",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScGZ84pyS-MstOKQkNP2TD0SMihbvT1G-Gm-XPV_V8SfOGKuQ/viewform"
  },
  {
    "orderIndex": 63,
    "name": "ANDRI YUDHI PRASETYO, ST",
    "nip": "197907232024211002",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/z5unoXhPisrFHYQe6"
  },
  {
    "orderIndex": 64,
    "name": "MIANTO, S.Kom.",
    "nip": "198005222024211005",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/St3Fvko6Q8Rk5P1N6"
  },
  {
    "orderIndex": 65,
    "name": "HARIS ALI MUHYIDIN, S.T",
    "nip": "198103052024211008",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSePrT6SB-ho1Qu-8X9Msnl2pHSrhkeXp3sh_m5NJQBt1K2-LA/viewform"
  },
  {
    "orderIndex": 66,
    "name": "MAMIEK ZUHRIYAH. S.Hum",
    "nip": "198112142024212008",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/6SoaEmuGWvds11M57"
  },
  {
    "orderIndex": 67,
    "name": "UMI RU'YATIN, S.Pd",
    "nip": "198201062024212001",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/f1Bak224cs2fbQWv6"
  },
  {
    "orderIndex": 68,
    "name": "YEFI WULANDARI, SE",
    "nip": "198204272024212014",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/uRdDxC8DuaGwexXS6"
  },
  {
    "orderIndex": 69,
    "name": "SARI NURHIDAYATI, S.Pd.",
    "nip": "198209202024212008",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/RinuqtFA6SvqSL1k8"
  },
  {
    "orderIndex": 70,
    "name": "SUWOYO, S.Kom",
    "nip": "198403072024211011",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdu7xAgcP3EduN8K2GQ4TgkUqHBOYkmDQCI07RKwj8csn0P3A/viewform"
  },
  {
    "orderIndex": 71,
    "name": "AAN SUSANTO, S.Pd.",
    "nip": "198410082024211016",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfNvGrFaOMlKRAFM-pU2Ri99i0wMsYyrBzlaPhRWrx3v3F_rw/viewform"
  },
  {
    "orderIndex": 72,
    "name": "YUNITA DWI WIRANTI, S.Pd",
    "nip": "198606052024212013",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/pcpQzaMSk9Stp7cg7"
  },
  {
    "orderIndex": 73,
    "name": "NUR FAUZIYAH, S.Ag.",
    "nip": "197411202025212006",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfv3nzKCScYWg6AFek-3gvT8RkTVVgcld3sF3LPxXMO0ST9fA/viewform"
  },
  {
    "orderIndex": 74,
    "name": "SUYANTI, S.Kom.",
    "nip": "198206012025212027",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/fgP9YYo9hxHuTtXj6"
  },
  {
    "orderIndex": 75,
    "name": "DELIA NURUL AFIFAH, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/DyU5ZXtraYh9wYc29"
  },
  {
    "orderIndex": 76,
    "name": "CAHYA ISKANDAR, S.T",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdI0DpURY4PnMrrxOZrTgYpoNM0Oi8z0kdkriti50-5Jcc8AA/viewform"
  },
  {
    "orderIndex": 77,
    "name": "EVY KUSHARDIANY, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/5VYu1RujWovmBBU3A"
  },
  {
    "orderIndex": 78,
    "name": "HUDAN RHARA ANGGRIADI, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdGiZq5Z_NRQ4BnCeDf3KwvRCPJp5pdbJ6d-IWHzLuQ_JTzLw/viewform"
  },
  {
    "orderIndex": 79,
    "name": "YUNIAR DWI LISTYANTO, ST",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfObp6dU2YLs8UnHrzFalutFKBR7jcQHfriWJ_eL89rfsp4yA/viewform"
  },
  {
    "orderIndex": 80,
    "name": "BENY WIJAYANTO, SS",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/2d2erB3kRKMkYt7U7"
  },
  {
    "orderIndex": 81,
    "name": "NURUL JAMILAH, S.Hum.",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/wsT14LzF1YIGLA4f6"
  },
  {
    "orderIndex": 82,
    "name": "ENDANG MULYANI, S.Pd.",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/Auiix31BCC39d3827"
  },
  {
    "orderIndex": 83,
    "name": "AGUS IRIANTO, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/9ox7839w57zhmph37"
  },
  {
    "orderIndex": 84,
    "name": "SAMUJI, S.Ag",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/xaxakR9EjF5QRACyv8"
  },
  {
    "orderIndex": 85,
    "name": "IKA UMAYA MARDIANA, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/FdBUf1m2wrFUJUXW7"
  },
  {
    "orderIndex": 86,
    "name": "NUR KHOLIFAH, S.Pd.",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfbc-fqTUiN-W3eGoJx6clkQZ0gJmQ33llKL0DkrWqSw_-cXA/viewform"
  },
  {
    "orderIndex": 87,
    "name": "AIDA QONITATILLAH, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/iTp6ejZeufb9GjdD6"
  },
  {
    "orderIndex": 88,
    "name": "YULI ANDRIYANI,  S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/zNoEfcKBWk4cLrSw6"
  },
  {
    "orderIndex": 89,
    "name": "VITA EKA RAHAYU, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/w4dULz23fLn5t2FS6"
  },
  {
    "orderIndex": 90,
    "name": "AKHMAD VICKRI HIDAYATULLAH, S.Pd",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScsaQccrJrLWyFuELeJUY_dlYER0px-lNCoStikizRhMTHllQ/viewform"
  },
  {
    "orderIndex": 91,
    "name": "HERI SUGIANTORO, S.Ag",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/FP6TDKV278Clj95X7"
  },
  {
    "orderIndex": 92,
    "name": "AKBAR ILHAM BAGASKARA PRATAMA, S.T",
    "nip": "-",
    "class": "-",
    "role": "Guru Pengajar",
    "journalFormUrl": "https://forms.gle/ECwx7SMeMMkf7RfN6"
  }
];

// Master Data Kelas
const ALL_CLASSES = [
  "X TAV", "X TEI 1", "X TEI 2", "X TPL 1", "X TPL 2", "X TPM 1", "X TPM 2", "X TKR1", "X TKR2", "X TBKR", "X TSM 1", "X TSM 2", "X DKV 1", "X DKV 2", "X DKV 3",
  "XI TAV", "XI TEI 1", "XI TEI 2", "XI TPL 1", "XI TPL 2", "XI TPM 1", "XI TPM 2", "XI TKR1", "XI TKR2", "XI TBKR", "XI TSM 1", "XI TSM 2", "XI DKV 1", "XI DKV 2", "XI DKV 3",
  "XII TAV", "XII TEI 1", "XII TEI 2", "XII TPL 1", "XII TPL 2", "XII TPM 1", "XII TPM 2", "XII TKR1", "XII TKR2", "XII TBKR", "XII TSM 1", "XII TSM 2", "XII DKV 1", "XII DKV 2", "XII DKV 3",
  "-"
];

// Master Data 5 Jenis Formulir (Urutan Resmi Sesuai Permintaan)
const INITIAL_FORMS = [
  {
    orderIndex: 1,
    id: "form_absensi_guru",
    name: "FORM ABSENSI MENGAJAR",
    category: "Presensi",
    icon: "fa-solid fa-clipboard-user",
    description: "Presensi dan laporan kegiatan mengajar harian (Auto-fill: Nama, NIP, Hari/Tanggal, Jam Ke, Kelas, Mapel).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfrm87oC00zamhQQBP4LS5BcwxSHa97M9plvLpYUHQ7dR-ybQ/viewform",
    entryGuru: "entry.691754896",
    entryNip: "entry.65154558",
    entryTanggal: "entry.1708105874",
    entryJamKe: "entry.585996771",
    entryKelas: "entry.666017338",
    entryMapel: "entry.73505426",
    isActive: true,
    statusBadge: "Auto-Fill Jadwal Aktif"
  },
  {
    orderIndex: 2,
    id: "form_jurnal_mengajar",
    name: "FORM JURNAL MENGAJAR",
    category: "Akademik",
    icon: "fa-solid fa-book-open-reader",
    description: "Jurnal agenda kegiatan mengajar harian, materi pembelajaran, dan catatan kelas (Auto-fill: Tanggal, Jam Ke, Kelas, Mapel).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.691754896",
    entryNip: "entry.65154558",
    entryTanggal: "entry.1708105874",
    entryJamKe: "entry.585996771",
    entryKelas: "entry.666017338",
    entryMapel: "entry.73505426",
    isActive: true,
    statusBadge: "Auto-Fill Jadwal Pribadi"
  },
  {
    orderIndex: 3,
    id: "form_absensi_piket",
    name: "FORM ABSENSI PIKET",
    category: "Piket",
    icon: "fa-solid fa-shield-halved",
    description: "Laporan catatan ketertiban dan presensi tugas piket guru harian.",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "entry.591543822",
    isActive: true,
    statusBadge: "Auto-Fill Siap"
  },
  {
    orderIndex: 4,
    id: "pengumpulan_bulanan_walikelas",
    name: "FORM WALI KELAS",
    category: "Walikelas",
    icon: "fa-solid fa-folder-open",
    description: "Pengumpulan rutin berkas administrasi dan laporan bulanan walikelas (Auto-fill: Nama Guru & NIP).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScD-3NZu95GMfCK1w-q3lw-iV7nbQ1wcKldsKi12NG6bu0rRA/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "",
    isActive: true,
    statusBadge: "Aktif & Terhubung"
  },
  {
    orderIndex: 5,
    id: "form_guru_wali",
    name: "FORM GURU WALI",
    category: "Guru Wali",
    icon: "fa-solid fa-hands-holding-child",
    description: "Pengumpulan rutin berkas administrasi dan laporan bulanan guru wali (Auto-fill: Nama & NIP).",
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeVYQG1tPodad-cUyHW5Mzx3CmO3L8GOx8AzWXajJqYkqbkBg/viewform",
    entryGuru: "entry.1599393498",
    entryNip: "entry.65154558",
    entryKelas: "",
    isActive: true,
    statusBadge: "Aktif & Terhubung"
  }
];

// Master Data Jadwal Mengajar Guru (Dimuat langsung dari Cloud Firestore)
const INITIAL_SCHEDULES = [];

// Format Pilihan Kelas Resmi di Google Form Absen Mengajar
const FORM_CLASS_OPTIONS = [
  "X  TAV", "X  TEI 1", "X  TEI 2", "X  TPL 1", "X  TPL 2", "X  TPM 1", "X  TPM 2", "X  TKR1", "X  TKR2", "X  TBKR", "X  TSM 1", "X  TSM 2", "X  DKV 1", "X  DKV 2", "X  DKV 3",
  "XI  TAV", "XI  TEI 1", "XI  TEI 2", "XI  TPL 1", "XI  TPL 2", "XI  TPM 1", "XI  TPM 2", "XI  TKR1", "XI  TKR2", "XI  TBKR", "XI  TSM 1", "XI  TSM 2", "XI  DKV 1", "XI  DKV 2", "XI  DKV 3",
  "XII  TAV", "XII  TEI 1", "XII  TEI 2", "XII  TPL 1", "XII  TPL 2", "XII  TPM 1", "XII  TPM 2", "XII  TKR1", "XII  TKR2", "XII  TBKR", "XII  TSM 1", "XII  TSM 2", "XII DKV 1", "XII  DKV 2", "XII  DKV 3"
];

function normalizeFormClassName(rawClass) {
  if (!rawClass || rawClass === '-') return '';
  const clean = rawClass.trim().replace(/\s+/g, ' ');
  const exact = FORM_CLASS_OPTIONS.find(opt => opt.replace(/\s+/g, ' ').toUpperCase() === clean.toUpperCase());
  if (exact) return exact;

  if (clean.startsWith('XII ')) return clean.replace('XII ', 'XII  ');
  if (clean.startsWith('XI ')) return clean.replace('XI ', 'XI  ');
  if (clean.startsWith('X ')) return clean.replace('X ', 'X  ');
  return clean;
}

function normalizeDayName(dayStr) {
  if (!dayStr) return '';
  const clean = String(dayStr).trim().replace(/['`’]/g, '').toLowerCase();
  if (clean.startsWith('sen')) return 'Senin';
  if (clean.startsWith('sel')) return 'Selasa';
  if (clean.startsWith('rab')) return 'Rabu';
  if (clean.startsWith('kam')) return 'Kamis';
  if (clean.startsWith('jum')) return 'Jumat';
  if (clean.startsWith('sab')) return 'Sabtu';
  if (clean.startsWith('min') || clean.startsWith('ahd')) return 'Minggu';
  return clean;
}

function formatTimeString(timeStr) {
  if (timeStr === undefined || timeStr === null || timeStr === '') return '';
  
  // Jika timeStr adalah angka desimal dari Excel (misal 0.2916666666666667 untuk 07:00)
  if (typeof timeStr === 'number' || (!isNaN(timeStr) && !String(timeStr).includes(':'))) {
    const num = parseFloat(timeStr);
    if (num >= 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
      const mm = String(totalMinutes % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  }

  // Jika berupa objek Date
  if (timeStr instanceof Date) {
    const hh = String(timeStr.getHours()).padStart(2, '0');
    const mm = String(timeStr.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  let s = String(timeStr).trim().replace(/\./g, ':');
  const parts = s.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].trim().padStart(2, '0');
    const mm = parts[1].trim().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return s;
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getActiveTeacherSchedule(teacher, now = new Date()) {
  if (!teacher) return null;
  const teacherNipDigits = (teacher.nip || '').replace(/\D/g, '');
  const teacherCleanName = (teacher.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : INITIAL_SCHEDULES;
  const teacherSchedules = schedules.filter(s => {
    const sNipDigits = (s.nip || '').replace(/\D/g, '');
    if (sNipDigits && teacherNipDigits && sNipDigits === teacherNipDigits) return true;
    
    const sCleanName = (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sCleanName && teacherCleanName) {
      if (sCleanName === teacherCleanName) return true;
      if (sCleanName.includes(teacherCleanName) || teacherCleanName.includes(sCleanName)) return true;
    }
    return false;
  });

  if (teacherSchedules.length === 0) return null;

  const currentDayIndex = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const currentDay = INDONESIAN_DAYS[currentDayIndex];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // ATURAN AKHIR PEKAN (Sabtu & Minggu): Libur KBM, HANYA isi Nama Guru & NIP
  if (currentDayIndex === 0 || currentDayIndex === 6) {
    return null;
  }

  // 1. Filter jadwal untuk hari aktif ini (Senin - Jumat) dengan normalisasi ejaan hari
  const todaySchedules = teacherSchedules.filter(s => normalizeDayName(s.hari) === currentDay);

  if (todaySchedules.length > 0) {
    // A. Cek apakah ada jadwal yang sedang aktif saat ini (prioritas sesi yang baru mulai jika tepat di batas waktu)
    const activeSlot = todaySchedules.find(s => {
      const sMulai = formatTimeString(s.jamMulai);
      const sSelesai = formatTimeString(s.jamSelesai);
      if (sMulai && sSelesai) {
        return currentTimeStr >= sMulai && currentTimeStr < sSelesai;
      }
      return false;
    }) || todaySchedules.find(s => {
      const sMulai = formatTimeString(s.jamMulai);
      const sSelesai = formatTimeString(s.jamSelesai);
      return sMulai && sSelesai && currentTimeStr >= sMulai && currentTimeStr <= sSelesai;
    });

    if (activeSlot) return activeSlot;

    // B. Jika belum waktunya pada hari ini, ambil jadwal terdekat berikutnya hari ini
    const upcomingTodaySlots = todaySchedules.filter(s => {
      const sMulai = formatTimeString(s.jamMulai);
      return sMulai && sMulai >= currentTimeStr;
    });
    if (upcomingTodaySlots.length > 0) {
      upcomingTodaySlots.sort((a, b) => formatTimeString(a.jamMulai).localeCompare(formatTimeString(b.jamMulai)));
      return upcomingTodaySlots[0];
    }
  }

  // C. Jika jadwal hari ini sudah terlewati (misal sore/malam hari Senin-Kamis):
  // Cek jadwal hari kerja berikutnya (besok)
  const nextDayIndex = (currentDayIndex + 1) % 7;
  if (nextDayIndex === 0 || nextDayIndex === 6) {
    // Jika besok adalah akhir pekan (Jumat sore -> Sabtu), HANYA isi Nama & NIP
    return null;
  }

  const nextDayName = INDONESIAN_DAYS[nextDayIndex];
  const nextDaySchedules = teacherSchedules.filter(s => normalizeDayName(s.hari) === nextDayName);

  if (nextDaySchedules.length > 0) {
    // Urutkan jadwal hari berikutnya dan ambil yang paling awal
    nextDaySchedules.sort((a, b) => formatTimeString(a.jamMulai).localeCompare(formatTimeString(b.jamMulai)));
    return nextDaySchedules[0];
  }

  // D. Jika hari berikutnya kosong: return null (HANYA isi Nama Guru & NIP)
  return null;
}

function sortAndNormalizeForms(formsList) {
  if (!formsList || formsList.length === 0) return [...INITIAL_FORMS];

  const ordered = [];
  INITIAL_FORMS.forEach(initForm => {
    const found = formsList.find(f => f.id === initForm.id);
    if (found) {
      ordered.push({
        ...found,
        name: initForm.name,
        icon: initForm.icon,
        category: initForm.category,
        orderIndex: initForm.orderIndex,
        entryTanggal: initForm.entryTanggal,
        entryJamKe: initForm.entryJamKe,
        entryMapel: initForm.entryMapel
      });
    } else {
      ordered.push({ ...initForm });
    }
  });

  // Append any extra custom forms added by admin
  formsList.forEach(f => {
    if (!INITIAL_FORMS.some(init => init.id === f.id)) {
      ordered.push(f);
    }
  });

  return ordered.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
}

// State Aplikasi
let currentTeachers = [...INITIAL_TEACHERS];
let currentForms = [...INITIAL_FORMS];
let currentSchedules = [...INITIAL_SCHEDULES];
let activeTeacher = {
  name: "MUCHAMAD ISKAK FATONI, S.Pd.",
  nip: "198109092022211004",
  class: "XII TEI 2",
  role: "Walikelas",
  journalFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfjyDwlnrARMtXAIKoDfFKeXOmdboY3BzLrniikGApFQctXqQ/viewform"
};
let currentUser = null;
const ADMIN_EMAIL = "iskakfatoni@gmail.com";

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavigation();
  initModals();
  initLiveClock();
  initImportExport();
  
  // Setup dropdown kelas di modal
  populateClassDropdowns();

  // Bersihkan cache lokal usang agar data 100% murni memori & Cloud Firestore
  localStorage.removeItem('portal_teachers_data');
  localStorage.removeItem('portal_forms_data');
  localStorage.removeItem('portal_schedule_data');

  // Setup Portal Guru (Attach MASUK button and NIP listeners immediately!)
  setupUserPortal();

  // Setup Form Builder
  setupFormBuilder();

  // Check URL Query Parameter (?nip=...)
  checkUrlParamsForTeacher();

  // Inisialisasi Firebase & Auth Listener
  setupFirebaseConnection();
});

/* ==========================================================================
   1. Tab Navigation & URL Routing Khusus per Guru (?nip=...)
   ========================================================================== */

function initNavigation() {
  // Main Tab Navigation
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });

      if (targetId === 'tab-admin') {
        renderAdminTables();
      } else if (targetId === 'tab-portal') {
        renderUserPortal();
      }
    });
  });

  // Admin Subtabs Navigation
  document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-subtarget');
      document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.admin-subpane').forEach(pane => {
        pane.classList.toggle('active', pane.id === targetId);
      });

      if (targetId === 'subtab-schedule') {
        renderScheduleTable();
      } else if (targetId === 'subtab-forms') {
        renderFormsTable();
      } else if (targetId === 'subtab-teachers') {
        renderTeachersTable();
      }
    });
  });

  // Admin Schedule Search Listener
  const scheduleSearchInput = document.getElementById('admin-schedule-search');
  if (scheduleSearchInput) {
    scheduleSearchInput.addEventListener('input', (e) => {
      renderScheduleTable(e.target.value.trim());
    });
  }

  // Tombol Admin di Header
  const btnAdminHeader = document.getElementById('btn-show-login-modal');
  if (btnAdminHeader) {
    btnAdminHeader.addEventListener('click', (e) => {
      e.preventDefault();
      switchToAdminPanel();
    });
  }

  // Profil Admin di Header
  const adminProfile = document.getElementById('admin-user-profile');
  if (adminProfile) {
    adminProfile.addEventListener('click', (e) => {
      if (e.target.closest('#btn-admin-logout')) return;
      e.preventDefault();
      switchToAdminPanel();
    });
  }

  // Logout Button in Portal Header
  const btnPortalLogout = document.getElementById('btn-portal-logout');
  if (btnPortalLogout) {
    btnPortalLogout.addEventListener('click', async () => {
      localStorage.removeItem('portal_logged_nip');
      sessionStorage.removeItem('portal_demo_admin');
      if (auth && isFirebaseActive) {
        try { await signOut(auth); } catch (e) {}
      }
      window.location.href = '../../index.html';
    });
  }

  // Tombol Kembali ke Portal Guru di dalam Admin Dashboard
  const btnBackPortal = document.getElementById('btn-admin-back-to-portal');
  if (btnBackPortal) {
    btnBackPortal.addEventListener('click', (e) => {
      e.preventDefault();
      switchToPortalView();
    });
  }

  // Admin Search Guru
  const adminSearch = document.getElementById('admin-teacher-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderTeachersTable(adminSearch.value.trim());
    });
  }

  // Admin Search Jadwal Mengajar
  const adminSchedSearch = document.getElementById('admin-schedule-search');
  if (adminSchedSearch) {
    adminSchedSearch.addEventListener('input', () => {
      renderScheduleTable(adminSchedSearch.value.trim());
    });
  }
}

export function switchToAdminPanel() {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === 'tab-admin');
  });

  const adminTab = document.getElementById('tab-admin');
  if (adminTab) {
    adminTab.classList.add('active');
  }

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (currentUser && currentUser.email) {
    if (adminLockedView) adminLockedView.classList.add('hidden');
    if (adminDashboardView) adminDashboardView.classList.remove('hidden');
    renderAdminTables();
  } else {
    if (adminLockedView) adminLockedView.classList.remove('hidden');
    if (adminDashboardView) adminDashboardView.classList.add('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function switchToPortalView() {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === 'tab-user-portal');
  });

  const portalTab = document.getElementById('tab-user-portal');
  if (portalTab) {
    portalTab.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkUrlParamsForTeacher() {
  const params = new URLSearchParams(window.location.search);
  const nipParam = params.get('nip');
  const adminParam = params.get('admin');
  const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : INITIAL_TEACHERS;

  // Jika URL mengarah ke admin mode
  if (adminParam === 'true') {
    switchToAdminPanel();
    return;
  }

  // 1. Cek dari URL Query Parameter (?nip=...)
  if (nipParam && nipParam !== '-') {
    const cleanNip = nipParam.replace(/[\s\.\-]+/g, '');
    const found = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanNip);
    if (found) {
      localStorage.setItem('portal_logged_nip', found.nip);
      showPortalView(found);
      showToast(`Selamat datang kembali, ${found.name}!`);
      return;
    }
  }

  // 2. Cek dari Sesi Tersimpan di Browser Guru (LocalStorage)
  const savedNip = localStorage.getItem('portal_logged_nip');
  if (savedNip && savedNip !== '-') {
    const cleanSavedNip = savedNip.replace(/[\s\.\-]+/g, '');
    const foundSaved = teachersList.find(t => t.nip && t.nip.replace(/[\s\.\-]+/g, '') === cleanSavedNip);
    if (foundSaved) {
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanSavedNip)}`;
      window.history.replaceState({ nip: foundSaved.nip }, '', newUrl);
      showPortalView(foundSaved);
      showToast(`Selamat datang kembali, ${foundSaved.name}!`);
      return;
    }
  }

  // 3. Cek apakah ada sesi admin di sessionStorage
  const demoAdmin = sessionStorage.getItem('portal_demo_admin');
  if (demoAdmin) {
    switchToAdminPanel();
    return;
  }

  // 4. Default Fallback: Tampilkan guru pertama / default jika tidak ada parameter agar dashboard selalu terisi
  const defaultTeacher = teachersList.find(t => t.nip === "198109092022211004") || teachersList[0];
  if (defaultTeacher) {
    showPortalView(defaultTeacher);
  }
}

function showPortalView(teacher) {
  if (!teacher) return;
  activeTeacher = teacher;
  
  // Update profil banner
  const nameEl = document.getElementById('active-teacher-name');
  const nipEl = document.getElementById('active-teacher-nip');
  const classEl = document.getElementById('active-teacher-class');
  const roleEl = document.getElementById('active-teacher-role');

  if (nameEl) nameEl.textContent = teacher.name;
  if (nipEl) nipEl.textContent = teacher.nip || '-';
  if (classEl) classEl.textContent = teacher.class || '-';
  if (roleEl) roleEl.textContent = teacher.role || 'Guru';

  renderUserPortal();
}

function getPersonalPortalUrl(teacher) {
  const base = window.location.origin + window.location.pathname;
  if (teacher.nip && teacher.nip !== '-') {
    return `${base}?nip=${encodeURIComponent(teacher.nip.replace(/[\s\.\-]+/g, ''))}`;
  }
  return `${base}?nip=${encodeURIComponent(teacher.name)}`;
}

/* ==========================================================================
   2. Inisialisasi Firebase & State Management
   ========================================================================== */

function setupFirebaseConnection() {
  const { isFirebaseActive: active } = initFirebase();
  const cloudBadgeDot = document.getElementById('cloud-status-dot');
  const cloudBadgeText = document.getElementById('cloud-status-text');
  const statDbStatus = document.getElementById('stat-db-status');

  if (active && auth) {
    if (cloudBadgeDot) cloudBadgeDot.classList.add('online');
    if (cloudBadgeText) cloudBadgeText.textContent = "Firebase Online";
    if (statDbStatus) statDbStatus.textContent = "Firebase Cloud";

    // Listener Auth Firebase
    onAuthStateChanged(auth, (user) => {
      if (user) {
        handleAdminLoginState(user.email, user.displayName);
      } else {
        handleAdminLogoutState();
      }
    });

    // Ambil data Firestore
    fetchFirestoreData();
  } else {
    if (cloudBadgeDot) cloudBadgeDot.classList.remove('online');
    if (cloudBadgeText) cloudBadgeText.textContent = "Mode Demo Lokal";
    if (statDbStatus) statDbStatus.textContent = "Lokal (Offline)";

    // Cek demo session di sessionStorage
    const demoAdmin = sessionStorage.getItem('portal_demo_admin');
    if (demoAdmin) {
      handleAdminLoginState(demoAdmin, "Administrator");
    } else {
      handleAdminLogoutState();
    }

    renderAdminTables();
  }
}

async function fetchFirestoreData() {
  const activeDb = getDb();
  if (!activeDb) {
    console.warn("⚠️ activeDb belum tersedia saat fetchFirestoreData dipanggil.");
    return;
  }

  // 1. Fetch Teachers
  try {
    const teachersSnapshot = await getDocs(collection(activeDb, "teachers"));
    if (!teachersSnapshot.empty) {
      const fetched = [];
      teachersSnapshot.forEach(doc => {
        fetched.push(doc.data());
      });
      currentTeachers = fetched;
      console.log(`[Firestore] ✅ ${fetched.length} guru berhasil dimuat.`);
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'teachers':", err);
  }

  // 2. Fetch Forms (Sinkronisasi dan Kunci Urutan Resmi)
  try {
    const formsSnapshot = await getDocs(collection(activeDb, "forms"));
    if (!formsSnapshot.empty) {
      const fetchedForms = [];
      formsSnapshot.forEach(doc => {
        fetchedForms.push({ id: doc.id, ...doc.data() });
      });
      currentForms = sortAndNormalizeForms(fetchedForms);
      console.log(`[Firestore] ✅ ${fetchedForms.length} formulir berhasil dimuat.`);
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'forms':", err);
  }

  // 3. Fetch Schedules (Sinkronisasi Jadwal Mengajar ke Semua Device / APK)
  try {
    const schedulesSnapshot = await getDocs(collection(activeDb, "schedules"));
    if (!schedulesSnapshot.empty) {
      const fetchedSchedules = [];
      schedulesSnapshot.forEach(doc => {
        fetchedSchedules.push(doc.data());
      });
      currentSchedules = fetchedSchedules;
      console.log(`[Firestore] ✅ ${fetchedSchedules.length} jadwal berhasil dimuat.`);
    } else {
      console.warn("[Firestore] ⚠️ Koleksi 'schedules' di Firestore kosong (0 dokumen).");
    }
  } catch (err) {
    console.error("❌ Error membaca koleksi 'schedules':", err);
  }

  // Re-check URL parameter and re-render forms with canonical order
  const adminTab = document.getElementById('tab-admin');
  if (adminTab && adminTab.classList.contains('active')) {
    renderAdminTables();
  } else {
    checkUrlParamsForTeacher();
    renderUserPortal();
    renderAdminTables();
  }
}

/* ==========================================================================
   3. Auth & Strict Admin Security
   ========================================================================== */

const AUTHORIZED_ADMIN_EMAILS = [
  "iskakfatoni@gmail.com"
];

function isAuthorizedAdminEmail(email) {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === String(email).trim().toLowerCase());
}

async function handleAdminLoginState(email, displayName) {
  if (!email || !isAuthorizedAdminEmail(email)) {
    console.warn("Percobaan akses akun non-admin:", email);
    if (auth && isFirebaseActive) {
      try { await signOut(auth); } catch (e) {}
    }
    handleAdminLogoutState();
    if (email) {
      alert(`⛔ AKSES DITOLAK!\n\nAkun Google "${email}" bukan Administrator terdaftar.\n\nHalaman Panel Admin hanya dapat diakses oleh akun resmi: iskakfatoni@gmail.com`);
      showToast('Akses ditolak: Akun bukan Administrator.');
    }
    return;
  }

  currentUser = { email, displayName };

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const emailDisplay = document.getElementById('admin-user-email');

  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.add('hidden');
  if (userProfile) userProfile.classList.remove('hidden');
  if (emailDisplay) emailDisplay.textContent = email;

  if (adminLockedView) adminLockedView.classList.add('hidden');
  if (adminDashboardView) adminDashboardView.classList.remove('hidden');
  renderAdminTables();
  showToast(`Selamat datang Admin (${email})!`);

  // Ambil data Firestore terbaru setelah autentikasi admin berhasil
  await fetchFirestoreData();

  // Auto-sync urutan & nama resmi formulir ke Cloud Firestore
  syncCanonicalFormsToFirestore();

  // Auto-sync data guru & Long URL Google Form ke Cloud Firestore
  syncCanonicalTeachersToFirestore();
}

async function syncCanonicalFormsToFirestore() {
  const activeDb = getDb();
  if (!activeDb || !currentUser || !isAuthorizedAdminEmail(currentUser.email)) return;
  try {
    for (const form of INITIAL_FORMS) {
      await setDoc(doc(activeDb, "forms", form.id), {
        name: form.name,
        category: form.category,
        icon: form.icon,
        description: form.description,
        baseUrl: form.baseUrl,
        entryGuru: form.entryGuru || "",
        entryNip: form.entryNip || "",
        entryTanggal: form.entryTanggal || "",
        entryJamKe: form.entryJamKe || "",
        entryKelas: form.entryKelas || "",
        entryMapel: form.entryMapel || "",
        isActive: form.isActive !== false,
        orderIndex: form.orderIndex,
        statusBadge: form.statusBadge
      }, { merge: true });
    }
    console.log("Urutan & teks resmi formulir berhasil diperbarui di Cloud Firestore.");
  } catch (err) {
    console.warn("Sinkronisasi formulir ke Firestore dilewati:", err);
  }
}

async function syncCanonicalTeachersToFirestore() {
  const activeDb = getDb();
  if (!activeDb || !currentUser || !isAuthorizedAdminEmail(currentUser.email)) return;
  try {
    const batch = writeBatch(activeDb);
    let count = 0;

    INITIAL_TEACHERS.forEach(t => {
      const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
      const ref = doc(activeDb, "teachers", docId);
      batch.set(ref, t, { merge: true });
      count++;
    });

    await batch.commit();
    console.log("🔥 [Firestore] Berhasil menyimpan " + count + " Master Data Guru & Long URL ke Cloud Firestore!");
  } catch (err) {
    console.warn("⚠️ Gagal sinkronisasi data guru ke Firestore:", err);
  }
}

function handleAdminLogoutState() {
  currentUser = null;

  const authBtn = document.getElementById('btn-show-login-modal');
  const userProfile = document.getElementById('admin-user-profile');
  const adminLockedView = document.getElementById('admin-locked-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');

  if (authBtn) authBtn.classList.remove('hidden');
  if (userProfile) userProfile.classList.add('hidden');
  if (adminLockedView) adminLockedView.classList.remove('hidden');
  if (adminDashboardView) adminDashboardView.classList.add('hidden');
}

/* ==========================================================================
   4. Landing Page NIP Gate & Portal Guru
   ========================================================================== */

function setupUserPortal() {
  const formLandingNip = document.getElementById('form-landing-nip');
  const landingNipInput = document.getElementById('landing-nip-input');
  const landingError = document.getElementById('landing-nip-error');
  const btnLandingGo = document.getElementById('btn-landing-go');
  const btnBackToLanding = document.getElementById('btn-back-to-landing-nip');
  const btnLandingAdmin = document.getElementById('btn-landing-admin-gate');

  // Core NIP Verification Logic
  const processLandingNipSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!landingNipInput) return;

    const rawVal = landingNipInput.value || '';
    const cleanVal = rawVal.trim().replace(/[\s\.\-]+/g, '');

    if (!cleanVal) {
      if (landingError) {
        landingError.classList.remove('hidden');
        landingError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Silakan ketik NIP Anda terlebih dahulu.`;
      }
      landingNipInput.focus();
      return;
    }

    // Pastikan master data tersedia (fallback ke INITIAL_TEACHERS jika currentTeachers kosong)
    const teachersList = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : INITIAL_TEACHERS;

    // 1. Cari guru berdasarkan NIP (membersihkan format spasi/tanda baca)
    let found = teachersList.find(t => {
      if (!t.nip || t.nip === '-') return false;
      const teacherCleanNip = String(t.nip).trim().replace(/[\s\.\-]+/g, '');
      return teacherCleanNip === cleanVal;
    });

    // 2. Fallback cerdas: jika tidak ditemukan dengan NIP, cari berdasarkan nama guru (jika guru mengetik nama)
    if (!found) {
      const searchName = rawVal.trim().toLowerCase();
      if (searchName.length >= 3) {
        found = teachersList.find(t => t.name.toLowerCase().includes(searchName) && t.nip && t.nip !== '-');
      }
    }

    if (found) {
      if (landingError) landingError.classList.add('hidden');
      
      // Simpan sesi NIP di LocalStorage agar tidak perlu ketik berulang kali
      localStorage.setItem('portal_logged_nip', found.nip);

      // Update URL query tanpa reload browser
      const cleanTeacherNip = String(found.nip).trim().replace(/[\s\.\-]+/g, '');
      const newUrl = `${window.location.pathname}?nip=${encodeURIComponent(cleanTeacherNip)}`;
      window.history.pushState({ nip: found.nip }, '', newUrl);
      
      // Buka Layar 2 (Dashboard Link Formulir)
      showPortalView(found);
      showToast(`Selamat datang, ${found.name}!`);
    } else {
      if (landingError) {
        landingError.classList.remove('hidden');
        landingError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> NIP <strong>${rawVal}</strong> tidak ditemukan di database guru. Pastikan 18 digit NIP sudah benar.`;
      }
      landingNipInput.focus();
    }
  };

  // Event Listeners untuk Form Submit, Klik Tombol MASUK, dan Tekan Enter
  if (formLandingNip) {
    formLandingNip.addEventListener('submit', processLandingNipSubmit);
  }
  if (btnLandingGo) {
    btnLandingGo.addEventListener('click', processLandingNipSubmit);
  }
  if (landingNipInput) {
    landingNipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        processLandingNipSubmit(e);
      }
    });
  }

  // 2. Tombol Theme Toggle di Landing Page
  const btnLandingTheme = document.getElementById('btn-landing-theme-toggle');
  if (btnLandingTheme) {
    btnLandingTheme.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      document.body.classList.toggle('dark-mode', !isDark);
      document.body.classList.toggle('light-mode', isDark);
      localStorage.setItem('portal_theme', isDark ? 'light' : 'dark');
    });
  }

  // 3. Tombol "Ganti NIP / Keluar" di Layar 2
  if (btnBackToLanding) {
    btnBackToLanding.addEventListener('click', () => {
      localStorage.removeItem('portal_logged_nip');
      window.history.pushState({}, '', window.location.pathname);
      showLandingView();
      showToast('Sesi NIP ditutup. Silakan masukkan NIP lain.');
    });
  }
}

function setActiveTeacher(teacher) {
  showPortalView(teacher);
}

function generateFormUrlForTeacher(form, teacher) {
  const params = new URLSearchParams();
  params.set('usp', 'pp_url');

  const now = new Date();
  const todaySchedule = getActiveTeacherSchedule(teacher, now);
  console.log(`[AutoForm] Guru: ${teacher ? teacher.name : 'Unknown'}, Total Jadwal di Memory: ${currentSchedules.length}, Jadwal Terpilih:`, todaySchedule);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  // Helper untuk menstandarkan URL Google Forms ke mode viewform dan menghapus query lama
  const cleanFormUrl = (url) => {
    if (!url) return '';
    let clean = url.trim().split('?')[0];
    clean = clean.replace(/\/edit(\/.*)?$/, '/viewform');
    if (clean.includes('docs.google.com/forms/d/') && !clean.endsWith('/viewform')) {
      clean = clean.replace(/\/+$/, '') + '/viewform';
    }
    return clean;
  };

  // 1. Form Absensi Mengajar Khusus dengan Auto-Fill Jadwal Lengkap
  if (form.id === "form_absensi_guru") {
    const targetUrl = cleanFormUrl(form.baseUrl);
    // Identitas Guru & Tanggal selalu diisi
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
    if (form.entryTanggal) params.set(form.entryTanggal, isoDate);

    // KEBUTUHAN 1 & 2:
    // Jika ada jadwal aktif / terdekat hari ini: isi Jam Ke, Kelas, dan Mapel
    if (todaySchedule) {
      if (form.entryJamKe && todaySchedule.jamKe) {
        params.set(form.entryJamKe, todaySchedule.jamKe);
      }
      if (form.entryKelas && todaySchedule.kelas) {
        params.set(form.entryKelas, normalizeFormClassName(todaySchedule.kelas));
      }
      if (form.entryMapel && todaySchedule.mataPelajaran) {
        params.set(form.entryMapel, todaySchedule.mataPelajaran);
      }
    } else {
      console.log("[AutoForm] Tidak ada jadwal yang cocok/aktif hari ini maupun besok. Jam, Kelas, dan Mapel dikosongkan.");
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 2. Form Jurnal Mengajar Pribadi Guru dengan Auto-Fill Jadwal Lengkap
  if (form.id === "form_jurnal_mengajar") {
    const rawUrl = (teacher && teacher.journalFormUrl && teacher.journalFormUrl.trim() !== '' && teacher.journalFormUrl !== '-') 
      ? teacher.journalFormUrl.trim() 
      : form.baseUrl;
    if (!rawUrl) return "#";

    const targetUrl = cleanFormUrl(rawUrl);

    // Identitas Guru (jika field entry tersedia)
    if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
    if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);

    // Selalu set tanggal hari ini
    params.set(form.entryTanggal || "entry.1708105874", isoDate);

    // Jika ada jadwal aktif / terdekat: isi Jam Ke, Kelas, dan Mapel
    if (todaySchedule) {
      if (todaySchedule.jamKe) {
        params.set(form.entryJamKe || "entry.585996771", todaySchedule.jamKe);
      }
      if (todaySchedule.kelas) {
        params.set(form.entryKelas || "entry.666017338", normalizeFormClassName(todaySchedule.kelas));
      }
      if (todaySchedule.mataPelajaran) {
        params.set(form.entryMapel || "entry.73505426", todaySchedule.mataPelajaran);
      }
    }

    return `${targetUrl}?${params.toString()}`;
  }

  // 3. Formulir Standar Lainnya
  const targetUrl = cleanFormUrl(form.baseUrl);
  if (form.entryGuru && teacher && teacher.name) params.set(form.entryGuru, teacher.name);
  if (form.entryNip && teacher && teacher.nip && teacher.nip !== '-') params.set(form.entryNip, teacher.nip);
  if (form.entryKelas && teacher && teacher.class && teacher.class !== '-') {
    params.set(form.entryKelas, normalizeFormClassName(teacher.class));
  }
  return `${targetUrl}?${params.toString()}`;
}

function renderUserPortal() {
  const container = document.getElementById('portal-forms-grid');
  const weekendBanner = document.getElementById('weekend-holiday-banner');
  if (!container) return;

  // Cek Hari Sabtu / Minggu (0 = Minggu, 6 = Sabtu)
  const now = new Date();
  const dayIndex = now.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (weekendBanner) {
    if (isWeekend) {
      weekendBanner.classList.remove('hidden');
    } else {
      weekendBanner.classList.add('hidden');
    }
  }

  const normalized = sortAndNormalizeForms(currentForms);
  const activeForms = normalized.filter(f => f.isActive !== false);

  if (activeForms.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Belum ada formulir aktif yang tersedia.</p></div>`;
    return;
  }

  container.innerHTML = activeForms.map((form, idx) => {
    const generatedUrl = generateFormUrlForTeacher(form, activeTeacher);
    const formIcon = form.icon || "fa-solid fa-file-signature";
    const themeIndex = (idx % 5) + 1;

    return `
      <a href="${generatedUrl}" target="_blank" rel="noopener noreferrer" class="form-direct-card card-theme-${themeIndex}" title="Buka ${form.name}">
        <div class="form-card-left">
          <div class="form-card-icon-box">
            <i class="${formIcon}"></i>
          </div>
          <div class="form-card-title-box">
            <span class="form-card-number">${idx + 1}.</span>
            <span class="form-card-title">${form.name}</span>
          </div>
        </div>
        <div class="form-card-right-icon">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </div>
      </a>
    `;
  }).join('');
}

/* ==========================================================================
   5. Admin Panel & CRUD
   ========================================================================== */

function renderAdminTables() {
  const statTeachers = document.getElementById('stat-total-teachers');
  const statForms = document.getElementById('stat-total-forms');
  if (statTeachers) statTeachers.textContent = currentTeachers.length;
  if (statForms) statForms.textContent = currentForms.length;

  renderTeachersTable();
  renderFormsTable();
  renderScheduleTable();
}

function renderScheduleTable(filterQuery = '') {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const schedules = (currentSchedules && currentSchedules.length > 0) ? currentSchedules : INITIAL_SCHEDULES;
  let filtered = schedules;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = schedules.filter(s => 
      (s.hari && s.hari.toLowerCase().includes(q)) ||
      (s.kelas && s.kelas.toLowerCase().includes(q)) ||
      (s.mataPelajaran && s.mataPelajaran.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.nip && s.nip.includes(q))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Tidak ada jadwal mengajar yang cocok.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, idx) => {
    const timeRange = (s.jamMulai && s.jamSelesai) ? `${s.jamMulai} - ${s.jamSelesai}` : '-';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.hari || '-'}</strong></td>
        <td><span class="badge-class">${s.jamKe || '-'}</span></td>
        <td class="font-mono">${timeRange}</td>
        <td><strong>${s.kelas || '-'}</strong></td>
        <td>${s.mataPelajaran || '-'}</td>
        <td>${s.name || '-'}</td>
        <td class="font-mono">${s.nip || '-'}</td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-del btn-del-schedule" data-index="${idx}" title="Hapus Jadwal">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-del-schedule').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (confirm('Yakin ingin menghapus jadwal ini?')) {
        deleteScheduleHandler(idx);
      }
    });
  });
}

async function deleteScheduleHandler(index) {
  if (currentSchedules && currentSchedules[index]) {
    const item = currentSchedules[index];
    currentSchedules.splice(index, 1);
    renderScheduleTable();

    if (db && isFirebaseActive) {
      try {
        const cleanNip = (item.nip || '').trim().replace(/[\s\.\-]+/g, '') || 'nonip';
        const cleanName = (item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanHari = (item.hari || '').trim().toLowerCase();
        const cleanJam = (item.jamKe || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const cleanKelas = (item.kelas || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
        const docId = item.id || `sch_${cleanNip}_${cleanName}_${cleanHari}_${cleanJam}_${cleanKelas}`.substring(0, 100);
        await deleteDoc(doc(db, "schedules", docId));
      } catch (e) {
        console.warn("Gagal hapus jadwal dari Firestore:", e);
      }
    }
    showToast('Jadwal berhasil dihapus.');
  }
}

function renderTeachersTable(filterQuery = '') {
  const tbody = document.getElementById('teachers-table-body');
  if (!tbody) return;

  let sorted = sortTeachersByMasterOrder(currentTeachers);
  let filtered = sorted;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = sorted.filter(t => t.name.toLowerCase().includes(q) || (t.nip && t.nip.includes(q)));
  }

  tbody.innerHTML = filtered.map((t, idx) => {
    let journalStatusBadge = '<span class="pill-badge" style="background:rgba(150,150,150,0.15);color:var(--text-muted);font-size:0.75rem;">Default Base</span>';
    if (t.journalFormUrl) {
      if (t.journalFormUrl.includes('docs.google.com/forms/d/')) {
        journalStatusBadge = `<a href="${t.journalFormUrl}" target="_blank" rel="noopener noreferrer" class="pill-badge pill-auto" style="text-decoration:none;font-size:0.75rem;" title="${t.journalFormUrl}"><i class="fa-solid fa-circle-check"></i> URL Panjang</a>`;
      } else if (t.journalFormUrl.includes('forms.gle/')) {
        journalStatusBadge = `<span class="pill-badge" style="background:rgba(234,179,8,0.2);color:#eab308;font-size:0.75rem;" title="Shortlink forms.gle tidak mendukung autofill. Silakan edit dan ubah ke URL viewform!"><i class="fa-solid fa-triangle-exclamation"></i> forms.gle</span>`;
      } else {
        journalStatusBadge = `<span class="pill-badge pill-auto" style="font-size:0.75rem;">Kustom</span>`;
      }
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${t.name}</strong></td>
        <td class="font-mono">${t.nip || '-'}</td>
        <td><span class="badge-class">${t.class || '-'}</span></td>
        <td>${t.role || 'Guru'}</td>
        <td>${journalStatusBadge}</td>
        <td>
          <div class="action-btns-row">
            <button class="btn-icon-action btn-edit-teacher" data-name="${t.name}" title="Edit Data">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-action btn-del btn-del-teacher" data-name="${t.name}" title="Hapus Guru">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach Edit & Delete Teacher handlers
  tbody.querySelectorAll('.btn-edit-teacher').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const teacher = currentTeachers.find(t => t.name === name);
      if (teacher) openTeacherModal(teacher);
    });
  });

  tbody.querySelectorAll('.btn-del-teacher').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-name');
      if (confirm(`Yakin ingin menghapus data guru "${name}"?`)) {
        await deleteTeacherHandler(name);
      }
    });
  });
}

function renderFormsTable() {
  const tbody = document.getElementById('forms-table-body');
  if (!tbody) return;

  tbody.innerHTML = currentForms.map((f) => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.category || 'Umum'}</td>
      <td class="font-mono">${f.entryGuru || '-'}</td>
      <td class="font-mono">${f.entryNip || '-'}</td>
      <td class="font-mono">${f.entryKelas || '-'}</td>
      <td><span class="pill-badge pill-auto">${f.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span></td>
      <td>
        <div class="action-btns-row">
          <button class="btn-icon-action btn-edit-form" data-id="${f.id}" title="Edit Form">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon-action btn-del btn-del-form" data-id="${f.id}" title="Hapus Form">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit & Delete Form handlers
  tbody.querySelectorAll('.btn-edit-form').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const form = currentForms.find(f => f.id === id);
      if (form) openFormModal(form);
    });
  });

  tbody.querySelectorAll('.btn-del-form').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Yakin ingin menghapus formulir ini?')) {
        await deleteFormHandler(id);
      }
    });
  });
}

// Teacher Save & Delete Handlers
async function saveTeacherHandler(teacherData) {
  const existingIdx = currentTeachers.findIndex(t => t.name === teacherData.name);
  if (existingIdx >= 0) {
    currentTeachers[existingIdx] = teacherData;
  } else {
    currentTeachers.unshift(teacherData);
  }

  const activeDb = getDb();
  if (activeDb) {
    try {
      const docId = teacherData.nip && teacherData.nip !== '-' ? teacherData.nip : teacherData.name.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(activeDb, "teachers", docId), teacherData);
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherData.name}" berhasil disimpan!`);
}

async function deleteTeacherHandler(teacherName) {
  const teacher = currentTeachers.find(t => t.name === teacherName);
  currentTeachers = currentTeachers.filter(t => t.name !== teacherName);

  const activeDb = getDb();
  if (activeDb && teacher) {
    try {
      const docId = teacher.nip && teacher.nip !== '-' ? teacher.nip : teacher.name.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteDoc(doc(activeDb, "teachers", docId));
    } catch (e) {
      console.warn("Firestore delete warning:", e);
    }
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Data guru "${teacherName}" dihapus.`);
}

// Form Save & Delete Handlers
async function saveFormHandler(formData) {
  const existingIdx = currentForms.findIndex(f => f.id === formData.id);
  if (existingIdx >= 0) {
    currentForms[existingIdx] = formData;
  } else {
    currentForms.push(formData);
  }

  if (db && isFirebaseActive) {
    try {
      await setDoc(doc(db, "forms", formData.id), formData);
    } catch (e) {
      console.warn("Firestore form sync warning:", e);
    }
  }

  renderAdminTables();
  renderUserPortal();
  showToast(`Formulir "${formData.name}" berhasil disimpan!`);
}

async function deleteFormHandler(formId) {
  currentForms = currentForms.filter(f => f.id !== formId);

  if (db && isFirebaseActive) {
    try {
      await deleteDoc(doc(db, "forms", formId));
    } catch (e) {
      console.warn("Firestore form delete warning:", e);
    }
  }

  renderAdminTables();
  renderUserPortal();
  showToast("Formulir telah dihapus.");
}

// 🚀 Seed 94 Master Teachers to Firestore
async function seedMasterTeachersToFirestore() {
  if (!confirm("Upload 94 data guru bawaan ke Firestore Cloud? Data yang sudah ada dengan nama yang sama akan diperbarui.")) return;

  showToast("Mengunggah master data guru ke Firestore...");
  currentTeachers = [...INITIAL_TEACHERS];

  if (db && isFirebaseActive) {
    try {
      const batch = writeBatch(db);
      INITIAL_TEACHERS.forEach(t => {
        const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
        const ref = doc(db, "teachers", docId);
        batch.set(ref, t);
      });
      await batch.commit();
      showToast("🚀 94 Master Data Guru berhasil diunggah ke Cloud Firestore!");
    } catch (err) {
      console.error("Gagal batch upload:", err);
      showToast("Gagal mengunggah ke Firestore. Pastikan izin Firestore Rules sudah diatur.");
    }
  } else {
    showToast("94 Master Guru dimuat ke penyimpanan lokal browser.");
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
}

/* ==========================================================================
   6. Impor & Ekspor Excel (.xlsx / .xls / JSON)
   ========================================================================== */

function sortTeachersByMasterOrder(teachers) {
  const masterNames = INITIAL_TEACHERS.map(t => t.name.toLowerCase());
  return [...teachers].sort((a, b) => {
    const idxA = masterNames.indexOf(a.name.toLowerCase());
    const idxB = masterNames.indexOf(b.name.toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.orderIndex || 999) - (b.orderIndex || 999);
  });
}

export function exportTeachersToExcel() {
  const xlsxLib = window.XLSX;
  if (!xlsxLib) {
    showToast("Library Excel sedang dimuat, silakan coba 1 detik lagi.");
    return;
  }

  const defaultForm = currentForms[0] || INITIAL_FORMS[0];
  const sortedTeachers = sortTeachersByMasterOrder(currentTeachers);

  try {
    const excelData = sortedTeachers.map((t, idx) => ({
      "No": idx + 1,
      "Nama Guru": t.name,
      "NIP": t.nip || "-",
      "Kelas Binaan": t.class || "-",
      "Peran": t.role || "Guru",
      "URL Jurnal Pribadi": t.journalFormUrl || "",
      "Link Portal Guru": getPersonalPortalUrl(t),
      "Link Form Walikelas": defaultForm ? generateFormUrlForTeacher(defaultForm, t) : ""
    }));

    const worksheet = xlsxLib.utils.json_to_sheet(excelData);
    
    // Lebar kolom rapi di Excel
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 36 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 45 },
      { wch: 55 },
      { wch: 55 }
    ];

    const workbook = xlsxLib.utils.book_new();
    xlsxLib.utils.book_append_sheet(workbook, worksheet, "Data Guru & Link");
    
    xlsxLib.writeFile(workbook, "data_link_guru_portal_autoform.xlsx");
    showToast("File Excel (.xlsx) berhasil diunduh dengan urutan database!");
  } catch (err) {
    console.error("Gagal export Excel .xlsx:", err);
    showToast("Gagal export Excel: " + err.message);
  }
}

export function exportTeachersToJSON() {
  const exportData = {
    generatedAt: new Date().toISOString(),
    totalTeachers: currentTeachers.length,
    teachers: currentTeachers.map(t => ({
      ...t,
      personalPortalUrl: getPersonalPortalUrl(t)
    }))
  };
  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  downloadBlob(jsonBlob, "data_guru_portal_autoform.json");
  showToast("File JSON berhasil diunduh!");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

// Expose to window for direct HTML onclick access
window.exportTeachersToExcel = exportTeachersToExcel;
window.exportTeachersToJSON = exportTeachersToJSON;

function initImportExport() {
  const inputFileExcel = document.getElementById('input-file-excel');
  const statusDiv = document.getElementById('import-preview-status');

  // Global click delegation for export & sync buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-do-export-excel') || e.target.closest('#btn-export-teachers-quick') || e.target.closest('#btn-export-excel')) {
      e.preventDefault();
      exportTeachersToExcel();
    }
    if (e.target.closest('#btn-do-export-json')) {
      e.preventDefault();
      exportTeachersToJSON();
    }
    if (e.target.closest('#btn-sync-master-teachers')) {
      e.preventDefault();
      seedMasterTeachersToFirestore();
    }
  });

  if (inputFileExcel) {
    inputFileExcel.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const xlsxLib = window.XLSX;
      if (!xlsxLib) {
        showToast('Library Excel belum selesai dimuat. Silakan coba sesaat lagi.');
        return;
      }

      if (statusDiv) statusDiv.textContent = `Membaca file ${file.name}...`;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = xlsxLib.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = xlsxLib.utils.sheet_to_json(firstSheet, { header: 1 });
          await processImportedExcelRows(rows, statusDiv);
        } catch (err) {
          console.error("Gagal membaca file Excel:", err);
          if (statusDiv) statusDiv.textContent = `❌ Gagal membaca file Excel: ${err.message}`;
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Impor Jadwal Mengajar Excel / CSV
  const inputImportSchedule = document.getElementById('input-import-schedule-excel');
  if (inputImportSchedule) {
    inputImportSchedule.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const xlsxLib = window.XLSX;
      if (!xlsxLib) {
        showToast('Library Excel belum selesai dimuat. Silakan coba sesaat lagi.');
        return;
      }

      showToast(`Membaca jadwal dari ${file.name}...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = xlsxLib.read(data, { type: 'array' });
          
          // Cari sheet yang berisi data jadwal
          let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
          for (const name of workbook.SheetNames) {
            if (name.toLowerCase().includes('jadwal')) {
              targetSheet = workbook.Sheets[name];
              break;
            }
          }

          const rows = xlsxLib.utils.sheet_to_json(targetSheet, { header: 1, raw: false, dateNF: 'HH:mm' });
          await processImportedScheduleRows(rows);
        } catch (err) {
          console.error("Gagal membaca file Excel Jadwal:", err);
          showToast(`❌ Gagal membaca file jadwal: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
      inputImportSchedule.value = '';
    });
  }
}

async function processImportedScheduleRows(rows) {
  if (!rows || rows.length <= 1) {
    showToast("❌ File jadwal kosong atau tidak memiliki baris data.");
    return;
  }

  // Deteksi letak baris Header secara dinamis (mencari baris yang memiliki kata 'hari', 'kelas', 'mapel', 'jam', dsb)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('hari') || rowStr.includes('kelas') || rowStr.includes('mapel') || rowStr.includes('jam')) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = (rows[headerRowIdx] || []).map(h => String(h || '').trim().toLowerCase());
  
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let nameIdx = headerRow.findIndex(h => h.includes("nama") || h.includes("guru"));
  let hariIdx = headerRow.findIndex(h => h.includes("hari"));
  let jamKeIdx = headerRow.findIndex(h => h.includes("jam_ke") || h.includes("jam ke") || h.includes("sesi"));
  let jamMulaiIdx = headerRow.findIndex(h => h.includes("jam_mulai") || h.includes("jam mulai") || h.includes("mulai"));
  let jamSelesaiIdx = headerRow.findIndex(h => h.includes("jam_selesai") || h.includes("jam selesai") || h.includes("selesai"));
  let kelasIdx = headerRow.findIndex(h => h.includes("kelas"));
  let mapelIdx = headerRow.findIndex(h => h.includes("mapel") || h.includes("pelajaran"));
  let ketIdx = headerRow.findIndex(h => h.includes("ket") || h.includes("ruang"));

  if (nipIdx === -1) nipIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (hariIdx === -1) hariIdx = 2;
  if (jamKeIdx === -1) jamKeIdx = 3;
  if (jamMulaiIdx === -1) jamMulaiIdx = 4;
  if (jamSelesaiIdx === -1) jamSelesaiIdx = 5;
  if (kelasIdx === -1) kelasIdx = 6;
  if (mapelIdx === -1) mapelIdx = 7;
  if (ketIdx === -1) ketIdx = 8;

  const newSchedules = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const nip = String(r[nipIdx] || '').trim();
    const name = String(r[nameIdx] || '').trim();
    const rawHari = String(r[hariIdx] || '').trim();
    const hari = normalizeDayName(rawHari) || rawHari;
    const jamKe = String(r[jamKeIdx] || '').trim();
    const jamMulai = formatTimeString(r[jamMulaiIdx] || '');
    const jamSelesai = formatTimeString(r[jamSelesaiIdx] || '');
    const kelas = String(r[kelasIdx] || '').trim();
    const mataPelajaran = String(r[mapelIdx] || '').trim();
    const keterangan = String(r[ketIdx] || '').trim();

    if (!hari && !kelas && !name) continue;

    newSchedules.push({
      nip,
      name,
      hari,
      jamKe,
      jamMulai,
      jamSelesai,
      kelas,
      mataPelajaran,
      keterangan
    });
  }

  if (newSchedules.length > 0) {
    currentSchedules = newSchedules;
    renderScheduleTable();

    // Sinkronisasi ke Cloud Firestore dengan batch commit
    const activeDb = getDb();
    if (activeDb) {
      try {
        const batch = writeBatch(activeDb);
        newSchedules.forEach((s) => {
          const cleanNip = (s.nip || '').trim().replace(/[\s\.\-]+/g, '') || 'nonip';
          const cleanName = (s.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cleanHari = (s.hari || '').trim().toLowerCase();
          const cleanJam = (s.jamKe || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const cleanKelas = (s.kelas || '').trim().replace(/[^a-zA-Z0-9]/g, '_');
          const docId = `sch_${cleanNip}_${cleanName}_${cleanHari}_${cleanJam}_${cleanKelas}`.substring(0, 100);
          batch.set(doc(activeDb, "schedules", docId), s);
        });
        await batch.commit();
        console.log("🔥 Berhasil mengunggah", newSchedules.length, "jadwal ke Cloud Firestore!");
        showToast(`✅ Berhasil mengimpor & sinkron ${newSchedules.length} jadwal ke Cloud Firestore!`);
      } catch (e) {
        console.error("Gagal sync jadwal ke Firestore:", e);
        showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal ke memori! (Cloud sync error: ${e.message})`);
      }
    } else {
      showToast(`✅ Berhasil mengimpor ${newSchedules.length} data jadwal mengajar!`);
    }
  } else {
    showToast("⚠️ Tidak ada data jadwal valid yang terbaca dari file.");
  }
}

async function processImportedExcelRows(rows, statusDiv) {
  if (!rows || rows.length <= 1) {
    if (statusDiv) statusDiv.textContent = "❌ File Excel kosong atau tidak memiliki baris data.";
    return;
  }

  const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
  
  // Cari index kolom secara dinamis berdasarkan nama header
  let nameIdx = headerRow.findIndex(h => h.includes("nama"));
  let nipIdx = headerRow.findIndex(h => h.includes("nip"));
  let classIdx = headerRow.findIndex(h => h.includes("kelas"));
  let roleIdx = headerRow.findIndex(h => h.includes("peran") || h.includes("role"));
  let journalIdx = headerRow.findIndex(h => h.includes("jurnal") || h.includes("journal"));

  // Fallback index default jika header tidak bernama
  if (nameIdx === -1) nameIdx = 1;
  if (nipIdx === -1) nipIdx = 2;
  if (classIdx === -1) classIdx = 3;
  if (roleIdx === -1) roleIdx = 4;
  if (journalIdx === -1) journalIdx = 5;

  const importedList = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameIdx] || '').trim();
    if (!name) continue;

    const nip = String(row[nipIdx] || '-').trim();
    const cls = String(row[classIdx] || '-').trim();
    const role = String(row[roleIdx] || 'Walikelas').trim();
    const journalFormUrl = String(row[journalIdx] || '').trim();

    importedList.push({
      name,
      nip: nip || '-',
      class: cls || '-',
      role: role || 'Walikelas',
      journalFormUrl: journalFormUrl || ''
    });
  }

  if (importedList.length === 0) {
    if (statusDiv) statusDiv.textContent = "❌ Tidak ada data guru valid yang ditemukan di file Excel.";
    return;
  }

  // Gabungkan ke currentTeachers
  importedList.forEach(imported => {
    const idx = currentTeachers.findIndex(t => t.name.toLowerCase() === imported.name.toLowerCase());
    if (idx >= 0) {
      currentTeachers[idx] = { ...currentTeachers[idx], ...imported };
    } else {
      currentTeachers.push(imported);
    }
  });

  // Sinkronisasi ke Cloud Firestore
  if (db && isFirebaseActive) {
    try {
      const batch = writeBatch(db);
      importedList.forEach(t => {
        const docId = t.nip && t.nip !== '-' ? t.nip : t.name.replace(/[^a-zA-Z0-9]/g, '_');
        batch.set(doc(db, "teachers", docId), t);
      });
      await batch.commit();
      if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke Cloud Firestore!</span>`;
    } catch (e) {
      if (statusDiv) statusDiv.textContent = `Disimpan lokal (Gagal sync cloud: ${e.message})`;
    }
  } else {
    if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--success);">✅ Berhasil mengimpor <strong>${importedList.length} guru</strong> ke penyimpanan browser!</span>`;
  }

  renderAdminTables();
  populateGuruSelect(document.getElementById('portal-guru-select'));
  showToast(`Impor ${importedList.length} data guru dari Excel berhasil!`);
}

/* ==========================================================================
   7. Form Builder (Tab 2)
   ========================================================================== */

function setupFormBuilder() {
  const formSelect = document.getElementById('builder-form-select');
  const guruSelect = document.getElementById('builder-guru-select');
  const kelasSelect = document.getElementById('builder-kelas-select');
  const builderForm = document.getElementById('custom-link-form');

  const emptyState = document.getElementById('result-empty-state');
  const resultContent = document.getElementById('result-content');
  const generatedText = document.getElementById('generated-url-text');
  const btnTest = document.getElementById('btn-test-generated-url');
  const btnCopy = document.getElementById('btn-copy-generated-url');

  // Populate Forms
  if (formSelect) {
    formSelect.innerHTML = currentForms.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  }

  // Populate Gurus
  if (guruSelect) {
    populateGuruSelect(guruSelect);
  }

  // Populate Kelas
  if (kelasSelect) {
    kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' + 
      ALL_CLASSES.filter(c => c !== '-').map(c => `<option value="${c}">${c}</option>`).join('');
  }

  if (builderForm) {
    builderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formId = formSelect.value;
      const targetForm = currentForms.find(f => f.id === formId) || currentForms[0];
      const guruVal = guruSelect.value;
      const nipVal = document.getElementById('builder-nip-input').value.trim();
      const kelasVal = kelasSelect.value;

      if (!targetForm || !guruVal || !nipVal || !kelasVal) return;

      const fullUrl = generateFormUrlForTeacher(targetForm, { name: guruVal, nip: nipVal, class: kelasVal });

      generatedText.value = fullUrl;
      btnTest.href = fullUrl;

      emptyState.style.display = 'none';
      resultContent.style.display = 'block';
      showToast('Tautan kustom berhasil dibuat!');
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (generatedText.value) copyToClipboard(generatedText.value);
    });
  }
}

function populateGuruSelect(selectElem) {
  if (!selectElem) return;
  const list = (currentTeachers && currentTeachers.length > 0) ? currentTeachers : INITIAL_TEACHERS;
  selectElem.innerHTML = '<option value="">-- Pilih Guru --</option>' + 
    list.map(t => `<option value="${t.name}">${t.name} (${t.nip !== '-' ? t.nip : t.class})</option>`).join('');
}

/* ==========================================================================
   8. UI Modals
   ========================================================================== */

function initModals() {
  // 1. Admin Email & Password Login Form
  const adminEmailPwdForm = document.getElementById('admin-email-password-form');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (adminEmailPwdForm) {
    adminEmailPwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-login-email').value.trim();
      const password = document.getElementById('admin-login-password').value;

      if (!email || !password) {
        alert("Silakan masukkan email dan password admin.");
        return;
      }

      if (!isAuthorizedAdminEmail(email)) {
        alert(`⛔ AKSES DITOLAK!\n\nEmail "${email}" bukan akun Administrator resmi (iskakfatoni@gmail.com).`);
        return;
      }

      if (!auth || !isFirebaseActive) {
        alert("Firebase Auth belum aktif atau sedang offline.");
        return;
      }

      try {
        showToast("⏳ Sedang memverifikasi akun Admin...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAdminLoginState(userCredential.user.email, userCredential.user.displayName || "Admin");
        switchToAdminPanel();
      } catch (error) {
        console.error("Gagal Login Email/Password:", error);
        let msg = error.message;
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          msg = "Password salah atau kredensial tidak valid. Silakan periksa kembali password akun Firebase Anda.";
        } else if (error.code === 'auth/user-not-found') {
          msg = "Pengguna belum terdaftar di Firebase Auth. Silakan daftarkan email ini di Firebase Console > Authentication > Users.";
        } else if (error.code === 'auth/too-many-requests') {
          msg = "Terlalu banyak percobaan login gagal. Silakan coba lagi beberapa saat lagi.";
        }
        alert(`⚠️ Gagal Masuk Admin:\n\n${msg}`);
        showToast(`Login gagal: ${error.code || 'Password salah'}`);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (auth && isFirebaseActive) {
        await signOut(auth);
      }
      handleAdminLogoutState();
      switchToPortalView();
      showToast('Anda telah keluar dari akun Admin.');
    });
  }

  // 2. Teacher Modal
  const modalTeacher = document.getElementById('modal-teacher-form');
  const btnOpenTeacher = document.getElementById('btn-modal-add-teacher');
  const btnCloseTeacher = document.getElementById('btn-close-teacher-modal');
  const formTeacher = document.getElementById('form-manage-teacher');

  if (btnOpenTeacher) {
    btnOpenTeacher.addEventListener('click', () => {
      openTeacherModal();
    });
  }
  if (btnCloseTeacher) btnCloseTeacher.addEventListener('click', () => modalTeacher.classList.add('hidden'));

  if (formTeacher) {
    formTeacher.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-teacher-name').value.trim();
      const nip = document.getElementById('edit-teacher-nip').value.trim();
      const cls = document.getElementById('edit-teacher-class').value;
      const role = document.getElementById('edit-teacher-role').value;
      const journalFormUrl = document.getElementById('edit-teacher-journal-url').value.trim();

      await saveTeacherHandler({ name, nip, class: cls, role, journalFormUrl });
      modalTeacher.classList.add('hidden');
    });
  }

  // 3. Form Modal
  const modalForm = document.getElementById('modal-form-manage');
  const btnOpenForm = document.getElementById('btn-modal-add-form');
  const btnCloseForm = document.getElementById('btn-close-form-modal');
  const formManageForm = document.getElementById('form-manage-form');

  if (btnOpenForm) btnOpenForm.addEventListener('click', () => openFormModal());
  if (btnCloseForm) btnCloseForm.addEventListener('click', () => modalForm.classList.add('hidden'));

  if (formManageForm) {
    formManageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-form-id').value || 'form_' + Date.now();
      const name = document.getElementById('edit-form-name').value.trim();
      const category = document.getElementById('edit-form-category').value.trim();
      const baseUrl = document.getElementById('edit-form-url').value.trim();
      const desc = document.getElementById('edit-form-desc').value.trim();
      const entryGuru = document.getElementById('edit-entry-guru').value.trim();
      const entryNip = document.getElementById('edit-entry-nip').value.trim();
      const entryKelas = document.getElementById('edit-entry-kelas').value.trim();

      await saveFormHandler({
        id,
        name,
        category,
        baseUrl,
        description: desc,
        entryGuru,
        entryNip,
        entryKelas,
        isActive: true
      });

      modalForm.classList.add('hidden');
    });
  }

  // 4. Firebase Config Settings Form
  const cfgForm = document.getElementById('firebase-config-form');
  const btnResetCfg = document.getElementById('btn-reset-firebase-config');

  if (cfgForm) {
    cfgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = document.getElementById('cfg-api-key').value.trim();
      const projectId = document.getElementById('cfg-project-id').value.trim();
      const authDomain = document.getElementById('cfg-auth-domain').value.trim();
      const appId = document.getElementById('cfg-app-id').value.trim();

      if (!apiKey || !projectId) {
        showToast('API Key dan Project ID wajib diisi!');
        return;
      }

      const customConfig = {
        apiKey,
        projectId,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`,
        appId: appId || ""
      };

      localStorage.setItem('portal_custom_firebase_config', JSON.stringify(customConfig));
      showToast('Konfigurasi Firebase disimpan! Memuat ulang sistem...');
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  if (btnResetCfg) {
    btnResetCfg.addEventListener('click', () => {
      localStorage.removeItem('portal_custom_firebase_config');
      showToast('Konfigurasi Firebase direset.');
      setTimeout(() => window.location.reload(), 1000);
    });
  }
}

function openTeacherModal(teacher = null) {
  const modal = document.getElementById('modal-teacher-form');
  const title = document.getElementById('modal-teacher-title');
  const nameInp = document.getElementById('edit-teacher-name');
  const nipInp = document.getElementById('edit-teacher-nip');
  const classInp = document.getElementById('edit-teacher-class');
  const roleInp = document.getElementById('edit-teacher-role');
  const journalInp = document.getElementById('edit-teacher-journal-url');

  if (teacher) {
    title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Data Guru`;
    nameInp.value = teacher.name;
    nameInp.readOnly = true;
    nipInp.value = teacher.nip && teacher.nip !== '-' ? teacher.nip : '';
    classInp.value = teacher.class || '-';
    roleInp.value = teacher.role || 'Walikelas';
    if (journalInp) journalInp.value = teacher.journalFormUrl || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Tambah Data Guru`;
    nameInp.value = '';
    nameInp.readOnly = false;
    nipInp.value = '';
    classInp.value = 'XII TEI 2';
    roleInp.value = 'Walikelas';
    if (journalInp) journalInp.value = '';
  }
  modal.classList.remove('hidden');
}

function openFormModal(form = null) {
  const modal = document.getElementById('modal-form-manage');
  const title = document.getElementById('modal-form-title');
  const idInp = document.getElementById('edit-form-id');
  const nameInp = document.getElementById('edit-form-name');
  const catInp = document.getElementById('edit-form-category');
  const urlInp = document.getElementById('edit-form-url');
  const descInp = document.getElementById('edit-form-desc');
  const guruInp = document.getElementById('edit-entry-guru');
  const nipInp = document.getElementById('edit-entry-nip');
  const kelasInp = document.getElementById('edit-entry-kelas');

  if (form) {
    title.innerHTML = `<i class="fa-solid fa-file-pen"></i> Edit Formulir`;
    idInp.value = form.id;
    nameInp.value = form.name;
    catInp.value = form.category || '';
    urlInp.value = form.baseUrl;
    descInp.value = form.description || '';
    guruInp.value = form.entryGuru || '';
    nipInp.value = form.entryNip || '';
    kelasInp.value = form.entryKelas || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Tambah Formulir Baru`;
    idInp.value = '';
    nameInp.value = '';
    catInp.value = 'Walikelas';
    urlInp.value = '';
    descInp.value = '';
    guruInp.value = 'entry.1599393498';
    nipInp.value = 'entry.65154558';
    kelasInp.value = 'entry.591543822';
  }
  modal.classList.remove('hidden');
}

function populateClassDropdowns() {
  const editClassSelect = document.getElementById('edit-teacher-class');
  if (editClassSelect) {
    editClassSelect.innerHTML = ALL_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

/* ==========================================================================
   9. Helper Utilities (Toast, Clipboard, Theme, Clock)
   ========================================================================= */

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgElem = document.getElementById('toast-message');
  if (!toast) return;
  if (msgElem) msgElem.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Tautan berhasil disalin ke clipboard!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand('copy');
    showToast('Tautan berhasil disalin ke clipboard!');
  } catch (err) {
    showToast('Gagal menyalin tautan.');
  }
  document.body.removeChild(el);
}

function getPreferredTheme() {
  const saved = localStorage.getItem('portal_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Auto detect dari pengaturan HP/OS pengguna
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());

  // Listener perubahan tema HP secara real-time
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portal_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('portal_theme', newTheme);
    });
  }
}

function initLiveClock() {
  const timeElem = document.getElementById('current-time');
  if (!timeElem) return;
  const update = () => {
    timeElem.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
  };
  update();
  setInterval(update, 1000);
}
