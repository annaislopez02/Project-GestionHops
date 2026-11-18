import React, { useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ScanBarcode,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { authApi, API_BASE_URL, extractApiErrorMessage } from '../api/client';
import { decodeJwt } from '../utils/jwt';
import { formatRut, validateRut } from '../utils/rut';
import type { JwtPayload } from '../types';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: JwtPayload) => void;
  sessionExpiredMessage?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  sessionExpiredMessage,
}) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rutTouched, setRutTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    sessionExpiredMessage ?? null
  );
  const [imageError, setImageError] = useState(false);

  const isRutValid = validateRut(rut);
  const showRutValidationError = rutTouched && rut.trim().length > 0 && !isRutValid;

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRutTouched(true);
    setErrorMessage(null);

    if (!rut.trim()) {
      setErrorMessage('Ingrese su RUT institucional para continuar.');
      return;
    }

    if (!validateRut(rut)) {
      setErrorMessage(
        'El RUT ingresado no es válido. Verifique el dígito verificador.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Ingrese su contraseña institucional.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        rut: formatRut(rut),
        password,
      });

      const token = response?.access_token;
      if (!token) {
        setErrorMessage('El servidor no devolvió un token de acceso válido.');
        return;
      }

      const decoded = decodeJwt(token);
      if (!decoded) {
        setErrorMessage('No fue posible validar la estructura del token JWT.');
        return;
      }

      onLoginSuccess(token, decoded);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage(
          'Credenciales inválidas (401). Verifique su RUT y contraseña institucional.'
        );
      } else {
        setErrorMessage(extractApiErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Panel institucional izquierdo */}
      <aside className="relative lg:w-[46%] xl:w-[48%] min-h-[280px] lg:min-h-screen bg-[#0F4C81] text-white overflow-hidden flex flex-col justify-between p-8 sm:p-12">
        {!imageError ? (
          <img
            src="/src/assets/images/hospital_clinical_wing_1794983680252.jpg"
            alt="Centro logístico clínico del Hospital Dr. Gustavo Fricke"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        ) : null}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#092C4C]/95 via-[#0F4C81]/88 to-[#0B3A63]/95"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              Hospital Dr. Gustavo Fricke
            </p>
            <p className="text-xs text-slate-200">
              Viña del Mar · Red Asistencial SSVQ
            </p>
          </div>
        </div>

        <div className="relative z-10 my-8 lg:my-0 max-w-lg">
          <p className="text-xs font-medium text-teal-200 mb-3">
            Logística Hospitalaria y Control Clínico
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
            Trazabilidad integral de insumos y dispositivos médicos.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed">
            Plataforma institucional para el registro auditado de ingresos, salidas
            y traspasos entre bodegas clínicas mediante lectura estándar GS1.
          </p>

          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/20">
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium text-teal-200">
                <ScanBarcode className="w-4 h-4 shrink-0" aria-hidden="true" />
                Estándar GS1
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                Lectura directa
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium text-teal-200">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                Auditoría JWT
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                Control por rol
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium text-teal-200">
                <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                Stock Crítico
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                Alertas en vivo
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative z-10 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/15">
          <span>Gestionhops · Uso exclusivo personal autorizado</span>
          <span className="font-mono text-slate-200">{API_BASE_URL}</span>
        </div>
      </aside>

      {/* Formulario de acceso institucional */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F4C81] mb-2">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Portal Institucional
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestionhops
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Inicie sesión con su RUT institucional y clave asignada.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="login-rut"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                RUT Institucional
              </label>
              <input
                id="login-rut"
                name="rut"
                type="text"
                autoComplete="username"
                inputMode="text"
                maxLength={12}
                value={rut}
                onChange={handleRutChange}
                onBlur={() => setRutTouched(true)}
                placeholder="19.876.543-2"
                aria-invalid={showRutValidationError}
                aria-describedby={
                  showRutValidationError ? 'rut-validation-error' : 'rut-hint'
                }
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  showRutValidationError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-[#0F4C81] focus:ring-[#0F4C81]/20'
                }`}
              />
              {showRutValidationError ? (
                <p
                  id="rut-validation-error"
                  className="mt-1.5 text-xs text-rose-600"
                >
                  Formato o dígito verificador inválido. Ej: 19.876.543-2
                </p>
              ) : (
                <p id="rut-hint" className="mt-1.5 text-xs text-slate-500">
                  Se formatea automáticamente con puntos y guion.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ingrese su contraseña"
                  className="w-full rounded-lg border border-slate-300 pl-3.5 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Todo movimiento registrado queda auditado bajo el identificador único
            de su sesión institucional.
          </p>
        </div>
      </main>
    </div>
  );
};
