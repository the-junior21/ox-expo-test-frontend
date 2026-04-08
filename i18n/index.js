import { I18n } from "i18n-js";
import * as Localization from "expo-localization";

import en from "./en";
import fr from "./fr";
import ar from "./ar";

const i18n = new I18n({
  en,
  fr,
  ar,
});

i18n.enableFallback = true;

// ✅ SAFE locale detection
const deviceLocale =
  Localization.getLocales()?.[0]?.languageCode || "en";

i18n.locale = deviceLocale;

export default i18n;
