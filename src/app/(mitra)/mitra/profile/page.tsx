"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Mail, Globe, FileText, User } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface CompanyProfile {
  name: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  siup: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  shareholders: string;
  established: string;
  industry: string;
}

const initialProfile: CompanyProfile = {
  name: "PT Bara Energi Indonesia",
  address: "Jl. Sudirman No. 123, Gedung Menara BEI Lt. 15",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  phone: "(021) 5555-1234",
  email: "info@baraenergi.co.id",
  website: "www.baraenergi.co.id",
  npwp: "01.234.567.8-012.345",
  siup: "1234/SIUP-B/PM/2023",
  contactPerson: "Ir. Hendra Wijaya",
  contactPhone: "0812-3456-7890",
  contactEmail: "hendra.w@baraenergi.co.id",
  shareholders: "PT Energi Nusantara (60%), PT Investasi Prima (40%)",
  established: "15 Maret 2005",
  industry: "Pertambangan & Energi",
};

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ptba-light-gray/50 last:border-b-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ptba-section-bg text-ptba-steel-blue">
        {icon}
      </div>
      <div>
        <p className="text-xs text-ptba-gray">{label}</p>
        <p className="text-sm font-medium text-ptba-charcoal">{value}</p>
      </div>
    </div>
  );
}

export default function MitraProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [editProfile, setEditProfile] = useState(initialProfile);

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ptba-charcoal">Edit Profil Perusahaan</h1>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          {([
            { key: "name", label: "Nama Perusahaan" },
            { key: "address", label: "Alamat" },
            { key: "city", label: "Kota" },
            { key: "province", label: "Provinsi" },
            { key: "phone", label: "Telepon" },
            { key: "email", label: "Email" },
            { key: "website", label: "Website" },
            { key: "npwp", label: "NPWP" },
            { key: "siup", label: "SIUP" },
            { key: "contactPerson", label: "Kontak Person" },
            { key: "contactPhone", label: "Telepon Kontak" },
            { key: "contactEmail", label: "Email Kontak" },
            { key: "shareholders", label: "Pemegang Saham" },
            { key: "established", label: "Tanggal Berdiri" },
            { key: "industry", label: "Industri" },
          ] as { key: keyof CompanyProfile; label: string }[]).map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-ptba-charcoal">{field.label}</label>
              <input
                type="text"
                value={editProfile[field.key]}
                onChange={(e) => setEditProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-ptba-light-gray bg-ptba-off-white px-4 py-2.5 text-sm text-ptba-charcoal focus:border-ptba-steel-blue focus:ring-2 focus:ring-ptba-steel-blue/20 outline-none"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCancel} className="rounded-lg border border-ptba-light-gray px-4 py-2 text-sm font-medium text-ptba-gray hover:bg-ptba-section-bg transition-colors">
              Batal
            </button>
            <button onClick={handleSave} className="rounded-lg bg-ptba-gold px-6 py-2 text-sm font-bold text-ptba-charcoal shadow-md hover:bg-ptba-gold-light transition-colors">
              Simpan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ptba-charcoal">Profil Perusahaan</h1>
        <button
          onClick={() => { setEditProfile(profile); setIsEditing(true); }}
          className="rounded-lg border border-ptba-steel-blue px-4 py-2 text-sm font-medium text-ptba-steel-blue hover:bg-ptba-steel-blue hover:text-white transition-colors"
        >
          Edit Profil
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Informasi Perusahaan</h2>
          <ProfileField icon={<Building2 className="h-4 w-4" />} label="Nama Perusahaan" value={profile.name} />
          <ProfileField icon={<MapPin className="h-4 w-4" />} label="Alamat" value={`${profile.address}, ${profile.city}, ${profile.province}`} />
          <ProfileField icon={<Phone className="h-4 w-4" />} label="Telepon" value={profile.phone} />
          <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
          <ProfileField icon={<Globe className="h-4 w-4" />} label="Website" value={profile.website} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label="Industri" value={profile.industry} />
          <ProfileField icon={<FileText className="h-4 w-4" />} label="Tanggal Berdiri" value={profile.established} />
        </div>

        {/* Legal & Contact */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Dokumen Legal</h2>
            <ProfileField icon={<FileText className="h-4 w-4" />} label="NPWP" value={profile.npwp} />
            <ProfileField icon={<FileText className="h-4 w-4" />} label="SIUP" value={profile.siup} />
            <ProfileField icon={<User className="h-4 w-4" />} label="Pemegang Saham" value={profile.shareholders} />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-ptba-charcoal">Kontak Person</h2>
            <ProfileField icon={<User className="h-4 w-4" />} label="Nama" value={profile.contactPerson} />
            <ProfileField icon={<Phone className="h-4 w-4" />} label="Telepon" value={profile.contactPhone} />
            <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile.contactEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}
