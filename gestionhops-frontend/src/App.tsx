import { useState, useEffect } from 'react';
import { api } from './api/client';
import {
  Activity,
  LogOut,
  Barcode,
  ArrowRightLeft,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import './App.css';

interface UsuarioPayload {
  sub: number;
  rut: string;
  rol: string;
  nombre?: string;
}

interface Dispositivo {
  id: number;
  codigo_gs1: string;
  nombre: string;
  categoria: string;
  stock_minimo: number;
}

interface Bodega {
  id: number;
  nombre: string;
  ubicacion?: string;
}

interface Movimiento {
  id: number;
  tipo_movimiento: 'INGRESO' | 'SALIDA' | 'TRASPASO';
  cantidad: number;
  fecha_hora: string;
  observacion?: string;
  dispositivo?: { nombre: string; codigo_gs1: string };
  bodega_origen?: { nombre: string };
  bodega_destino?: { nombre: string };
  usuario?: { nombre: string; rol: string };
}

function parseJwt(token: string): UsuarioPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('gestionhops_token')
  );
  const [user, setUser] = useState<UsuarioPayload | null>(() => {
    const saved = localStorage.getItem('gestionhops_token');
    return saved ? parseJwt(saved) : null;
  });

  // Login states
  const [rut, setRut] = useState('19.876.543-2');
  const [password, setPassword] = useState('fricke2026');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard states
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // Form states
  const [gs1Input, setGs1Input] = useState('');
  const [dispositivoId, setDispositivoId] = useState<number | ''>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<
    'INGRESO' | 'SALIDA' | 'TRASPASO'
  >('INGRESO');
  const [bodegaOrigenId, setBodegaOrigenId] = useState<number | ''>('');
  const [bodegaDestinoId, setBodegaDestinoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [observacion, setObservacion] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const cargarDatos = async () => {
    try {
      const [resDisp, resBod, resMov] = await Promise.all([
        api.get('/dispositivos'),
        api.get('/bodegas'),
        api.get('/movimientos'),
      ]);
      setDispositivos(resDisp.data);
      setBodegas(resBod.data);
      setMovimientos(resMov.data);
      if (resDisp.data.length > 0 && !dispositivoId) {
        setDispositivoId(resDisp.data[0].id);
      }
      if (resBod.data.length > 0 && !bodegaDestinoId) {
        setBodegaDestinoId(resBod.data[0].id);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { rut, password });
      localStorage.setItem('gestionhops_token', data.access_token);
      setToken(data.access_token);
      setUser(parseJwt(data.access_token));
    } catch (err: any) {
      setLoginError(
        err.response?.data?.message || 'Credenciales inválidas o servidor apagado'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gestionhops_token');
    setToken(null);
    setUser(null);
  };

  const handleBuscarGs1 = async () => {
    if (!gs1Input.trim()) return;
    setFeedback(null);
    try {
      const { data } = await api.get(`/dispositivos/gs1/${gs1Input.trim()}`);
      setDispositivoId(data.id);
      setFeedback({
        type: 'success',
        text: `Insumo escaneado: ${data.nombre} (${data.codigo_gs1})`,
      });
    } catch {
      setFeedback({
        type: 'error',
        text: `Código GS1 "${gs1Input}" no encontrado en el catálogo.`,
      });
    }
  };

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!dispositivoId) {
      setFeedback({ type: 'error', text: 'Selecciona un dispositivo médico.' });
      return;
    }

    const payload: Record<string, any> = {
      dispositivo_id: Number(dispositivoId),
      tipo_movimiento: tipoMovimiento,
      cantidad: Number(cantidad),
    };

    if (observacion.trim()) payload.observacion = observacion.trim();
    if (tipoMovimiento === 'INGRESO' || tipoMovimiento === 'TRASPASO') {
      if (bodegaDestinoId) payload.bodega_destino_id = Number(bodegaDestinoId);
    }
    if (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRASPASO') {
      if (bodegaOrigenId) payload.bodega_origen_id = Number(bodegaOrigenId);
    }

    try {
      await api.post('/movimientos', payload);
      setFeedback({
        type: 'success',
        text: `Movimiento (${tipoMovimiento}) registrado y auditado correctamente.`,
      });
      setObservacion('');
      setCantidad(1);
      cargarDatos();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFeedback({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : msg || 'Error al registrar movimiento',
      });
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Activity size={40} color="#0f4c81" />
            <h1>Gestionhops</h1>
            <p>Trazabilidad Clínica y Logística Hospitalaria</p>
          </div>

          {loginError && <div className="alert alert-error">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>RUT Institucional</label>
              <input
                type="text"
                className="form-control"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="19.876.543-2"
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="navbar">
        <div className="navbar-brand">
          <Activity size={24} />
          <span>Gestionhops — Hospital Gustavo Fricke</span>
        </div>
        <div className="navbar-user">
          <span>RUT: {user?.rut}</span>
          <span className="badge-role">{user?.rol}</span>
          <button onClick={handleLogout} className="btn btn-logout">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="main-grid">
        {/* Columna Izquierda: Escáner GS1 + Registro de Movimiento */}
        <section className="card">
          <h2 className="card-title">
            <ArrowRightLeft size={20} /> Registrar Movimiento de Inventario
          </h2>

          {feedback && (
            <div
              className={`alert ${
                feedback.type === 'success' ? 'alert-success' : 'alert-error'
              }`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Lector rápido GS1 */}
          <div className="form-group">
            <label>Lectura Rápida Código de Barras GS1</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Escanea o escribe el código GS1..."
                value={gs1Input}
                onChange={(e) => setGs1Input(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarGs1()}
              />
              <button
                type="button"
                onClick={handleBuscarGs1}
                className="btn btn-primary"
                style={{ width: 'auto' }}
              >
                <Barcode size={18} /> Buscar
              </button>
            </div>
          </div>

          <form onSubmit={handleRegistrarMovimiento}>
            <div className="form-group">
              <label>Dispositivo / Insumo Clínico</label>
              <select
                className="form-control"
                value={dispositivoId}
                onChange={(e) => setDispositivoId(Number(e.target.value))}
                required
              >
                <option value="">-- Seleccionar insumo --</option>
                {dispositivos.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.codigo_gs1}] {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Movimiento</label>
              <select
                className="form-control"
                value={tipoMovimiento}
                onChange={(e) =>
                  setTipoMovimiento(
                    e.target.value as 'INGRESO' | 'SALIDA' | 'TRASPASO'
                  )
                }
              >
                <option value="INGRESO">INGRESO (Recepción en Bodega)</option>
                <option value="SALIDA">SALIDA (Despacho Clínico / Consumo)</option>
                <option value="TRASPASO">TRASPASO (Entre Bodegas)</option>
              </select>
            </div>

            {(tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRASPASO') && (
              <div className="form-group">
                <label>Bodega de Origen</label>
                <select
                  className="form-control"
                  value={bodegaOrigenId}
                  onChange={(e) => setBodegaOrigenId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Seleccionar origen --</option>
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(tipoMovimiento === 'INGRESO' || tipoMovimiento === 'TRASPASO') && (
              <div className="form-group">
                <label>Bodega de Destino</label>
                <select
                  className="form-control"
                  value={bodegaDestinoId}
                  onChange={(e) => setBodegaDestinoId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Seleccionar destino --</option>
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Cantidad (Unidades)</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label>Observación / Lote / Servicio (Opcional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Pabellón 3, Lote #A45"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-accent">
              Confirmar y Auditar Movimiento
            </button>
          </form>
        </section>

        {/* Columna Derecha: Bitácora Auditada en Tiempo Real */}
        <section className="card">
          <h2 className="card-title">
            <History size={20} /> Bitácora de Trazabilidad Auditada
          </h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Insumo</th>
                  <th>Cant.</th>
                  <th>Bodega</th>
                  <th>Responsable JWT</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                      Sin movimientos registrados aún.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={`tag tag-${m.tipo_movimiento}`}>
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td>
                        <strong>{m.dispositivo?.nombre || `ID #${m.id}`}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {m.observacion || m.dispositivo?.codigo_gs1}
                        </div>
                      </td>
                      <td>
                        <strong>{m.cantidad}</strong>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {m.bodega_destino?.nombre || m.bodega_origen?.nombre || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{m.usuario?.nombre || 'Auditado'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {m.usuario?.rol}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;