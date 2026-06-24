"use client";

import { SubmitButton } from "@/components/pending";
import { useState } from "react";
import { BR_STATES, COUNTRIES } from "../_regions";
import { btnCbx, inputCbx, labelCbx } from "../_ui";

type Initial = {
  business_type: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

/** Formulário de enriquecimento: tipo de negócio (do registro) + região
 *  (país → estado/cidade) + contatos. País=Brasil mostra o seletor de UF. */
export function ClientProfileForm({
  holdingId,
  initial,
  businessTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action,
}: {
  holdingId: string;
  initial: Initial;
  businessTypes: string[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [country, setCountry] = useState(initial.country ?? "Brasil");
  const isBR = country === "Brasil";

  // Garante o valor atual como opção mesmo se saiu do registro.
  const types = businessTypes.includes(initial.business_type ?? "")
    ? businessTypes
    : initial.business_type
      ? [initial.business_type, ...businessTypes]
      : businessTypes;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="holding_id" value={holdingId} />

      <div>
        <label htmlFor="cbx-profile-business-type" className={labelCbx}>
          Tipo de negócio
        </label>
        <select
          id="cbx-profile-business-type"
          name="business_type"
          defaultValue={initial.business_type ?? ""}
          className={`mt-1 ${inputCbx}`}
        >
          <option value="">— selecione —</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="cbx-profile-country" className={labelCbx}>
            País
          </label>
          <select
            id="cbx-profile-country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`mt-1 ${inputCbx}`}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cbx-profile-state" className={labelCbx}>
            Estado
          </label>
          {isBR ? (
            <select
              id="cbx-profile-state"
              name="state"
              defaultValue={initial.state ?? ""}
              className={`mt-1 ${inputCbx}`}
            >
              <option value="">— UF —</option>
              {BR_STATES.map(([uf, nome]) => (
                <option key={uf} value={uf}>
                  {uf} — {nome}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="cbx-profile-state"
              name="state"
              defaultValue={initial.state ?? ""}
              placeholder="Estado/Província"
              className={`mt-1 ${inputCbx}`}
            />
          )}
        </div>
        <div>
          <label htmlFor="cbx-profile-city" className={labelCbx}>
            Cidade
          </label>
          <input
            id="cbx-profile-city"
            name="city"
            defaultValue={initial.city ?? ""}
            placeholder="Cidade"
            className={`mt-1 ${inputCbx}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="cbx-profile-contact-name" className={labelCbx}>
            Contato responsável
          </label>
          <input
            id="cbx-profile-contact-name"
            name="contact_name"
            defaultValue={initial.contact_name ?? ""}
            className={`mt-1 ${inputCbx}`}
          />
        </div>
        <div>
          <label htmlFor="cbx-profile-contact-email" className={labelCbx}>
            E-mail do contato
          </label>
          <input
            id="cbx-profile-contact-email"
            name="contact_email"
            type="email"
            defaultValue={initial.contact_email ?? ""}
            className={`mt-1 ${inputCbx}`}
          />
        </div>
        <div>
          <label htmlFor="cbx-profile-contact-phone" className={labelCbx}>
            Telefone
          </label>
          <input
            id="cbx-profile-contact-phone"
            name="contact_phone"
            defaultValue={initial.contact_phone ?? ""}
            className={`mt-1 ${inputCbx}`}
          />
        </div>
      </div>

      <SubmitButton className={btnCbx}>Salvar cadastro</SubmitButton>
    </form>
  );
}
