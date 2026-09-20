import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { AdvancedModeProvider } from "@/lib/advanced-mode";

import Layout from "@/components/Layout";
import TextEncryption from "@/pages/TextEncryption";
import Encoding from "@/pages/Encoding";
import ClassicalCiphers from "@/pages/ClassicalCiphers";
import FileEncryption from "@/pages/FileEncryption";
import Steganography from "@/pages/Steganography";
import KeyManagement from "@/pages/KeyManagement";
import Settings from "@/pages/Settings";
import PasswordGenerator from "@/pages/PasswordGenerator";
import HashCalculator from "@/pages/HashCalculator";
import Help from "@/pages/Help";
import Donate from "@/pages/Donate";
import KeyVault from "@/pages/KeyVault";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdvancedModeProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<TextEncryption />} />
                  <Route path="/encoding" element={<Encoding />} />
                  <Route path="/classical" element={<ClassicalCiphers />} />
                  <Route path="/files" element={<FileEncryption />} />
                  <Route path="/steganography" element={<Steganography />} />
                  <Route path="/passwords" element={<PasswordGenerator />} />
                  <Route path="/hashes" element={<HashCalculator />} />
                  <Route path="/keys" element={<KeyManagement />} />
                  <Route path="/vault" element={<KeyVault />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<PageNotFound />} />
                </Route>
              </Routes>
              <Toaster />
            </Router>
          </QueryClientProvider>
        </AdvancedModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
