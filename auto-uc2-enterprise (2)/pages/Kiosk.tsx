import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Card, Button } from '../components/UI';
import { Smartphone, RefreshCw } from 'lucide-react';

export const Kiosk: React.FC = () => {
  const [sessionToken, setSessionToken] = useState('AUTO-SESSION-' + Math.random().toString(36).substr(2, 9).toUpperCase());

  const regenerate = () => {
    setSessionToken('AUTO-SESSION-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Showroom Kiosk Portal</h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">Scan the QR code below to connect your mobile device and start your personalized car buying journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <Card className="p-10 flex flex-col items-center justify-center bg-zinc-900 border-zinc-800 text-white shadow-2xl shadow-zinc-900/40">
          <div className="bg-white p-6 rounded-3xl shadow-lg mb-8">
            <QRCode value={`https://auto-uc2.app/portal?token=${sessionToken}`} size={200} level="H" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Secure Session Token</p>
            <p className="text-blue-400 font-mono text-lg font-bold">{sessionToken}</p>
          </div>
          <Button variant="ghost" className="mt-8 text-zinc-500 hover:text-white" onClick={regenerate}>
            <RefreshCw size={18} /> Refresh QR
          </Button>
        </Card>

        <div className="space-y-8">
          <div className="space-y-2">
             <h3 className="text-xl font-bold text-zinc-900">How to Connect</h3>
             <p className="text-zinc-500">Enable Bluetooth and scan with your camera app.</p>
          </div>

          {[
            { step: 1, title: 'Open Camera', desc: 'Point your device at the screen.' },
            { step: 2, title: 'Approve Link', desc: 'Tap the link to enter the secure portal.' },
            { step: 3, title: 'Manage Experience', desc: 'Browse, offer, and sign documents instantly.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                {s.step}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900">{s.title}</h4>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            </div>
          ))}

          <Card className="bg-blue-50 border-blue-100">
            <div className="flex gap-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 h-fit">
                <Smartphone size={24} />
              </div>
              <div>
                <p className="font-bold text-blue-900">Kiosk Active</p>
                <p className="text-sm text-blue-700">This display is registered to Agency #942. Unauthorized scans are logged.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
