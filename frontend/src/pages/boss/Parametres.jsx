import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BossLayout from '../../components/BossLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';

const WA_NUMBER = '22665189025';

export default function BossParametres() {
  const { token, salon, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', telephone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (salon) setForm({ nom: salon.nom||'', telephone: salon.telephone||'' }); }, [salon]);

  async function saveSalon(e) {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/api/salons/me', form, token); toast('Informations mises à jour'); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent(`Bonjour, je suis patron de "${salon?.nom}" (code: ${salon?.salon_code}). Je souhaite commander un site web.`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  }

  return (
    <BossLayout title="Paramètres" subtitle="Configuration du salon">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>

        {/* Colonne gauche */}
        <div>
          {/* Code salon */}
          <div className="card" style={{textAlign:'center',marginBottom:16}}>
            <div className="stat-label" style={{marginBottom:10}}>Code d'accès coiffeurs</div>
            <div style={{fontSize:32,fontWeight:700,letterSpacing:8,color:'var(--accent)',margin:'8px 0 16px'}}>{salon?.salon_code}</div>
            <button className="btn btn-secondary btn-sm" style={{width:'auto',margin:'0 auto'}}
              onClick={() => { navigator.clipboard?.writeText(salon?.salon_code); toast('Code copié'); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copier le code
            </button>
          </div>

          {/* Abonnement */}
          <div className="card">
            <div className="card-header" style={{marginBottom:0}}>
              <span className="card-title">Abonnement</span>
              <span className="badge badge-green">Actif</span>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div>
          {/* Infos salon */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><span className="card-title">Informations du salon</span></div>
            <form onSubmit={saveSalon}>
              <div className="form-group"><label className="form-label">Nom du salon</label>
                <input className="form-input" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))}/></div>
              <div className="form-group" style={{marginBottom:16}}><label className="form-label">Téléphone</label>
                <input className="form-input" type="tel" value={form.telephone} onChange={e => setForm(p => ({...p, telephone: e.target.value}))}/></div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={saving} style={{width:'auto'}}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>

          {/* Site web */}
          <div className="card" style={{border:'1px solid #BFDBFE',background:'#EFF6FF',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:'#1E40AF',marginBottom:6}}>Site web pour votre salon</div>
            <p style={{fontSize:13,color:'#3B82F6',lineHeight:1.6,marginBottom:14}}>Obtenez un site professionnel pour que vos clients vous trouvent en ligne.</p>
            <button className="btn btn-sm" onClick={openWhatsApp} style={{background:'#25D366',color:'white',border:'none',width:'auto'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Demander via WhatsApp
            </button>
          </div>

          {/* Déconnexion */}
          <button className="btn btn-secondary" onClick={async () => { await logout(); navigate('/'); }}
            style={{color:'var(--danger)',borderColor:'#FECACA'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </BossLayout>
  );
}
