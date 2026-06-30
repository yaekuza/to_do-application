import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { loadPreferences } from '../lib/preferences';

const DAY = 24 * 60 * 60 * 1000;
const PROFILE_PANEL_ORDER_KEY = 'takenhandelaar-profile-panel-order';
const DEFAULT_PANEL_ORDER = ['activity', 'pace', 'overview', 'details'];

function loadPanelOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_PANEL_ORDER_KEY) || '[]');
    const valid = saved.filter((id) => DEFAULT_PANEL_ORDER.includes(id));
    const missing = DEFAULT_PANEL_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return DEFAULT_PANEL_ORDER;
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [prefs, setPrefs] = useState(loadPreferences);
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    age: '',
    birthplace: '',
    school: '',
    study_program: '',
    study_year: '',
  });
  const [saved, setSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [cropper, setCropper] = useState(null);
  const [bannerPalette, setBannerPalette] = useState({ primary: '13, 15, 18', secondary: '32, 36, 43' });
  const [error, setError] = useState('');
  const [panelOrder, setPanelOrder] = useState(loadPanelOrder);
  const [draggingPanel, setDraggingPanel] = useState('');
  const pageRef = useRef(null);
  const saveButtonRef = useRef(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const panelRefs = useRef(new Map());
  const layoutSnapshot = useRef(null);

  useEffect(() => {
    Promise.all([api.profile.get(), api.tasks.list({})])
      .then(([p, t]) => {
        setProfile(p);
        setTasks(t ?? []);
        setForm({
          display_name: p?.display_name ?? '',
          username: p?.username ?? '',
          bio: p?.bio ?? '',
          age: p?.age ?? '',
          birthplace: p?.birthplace ?? '',
          school: p?.school ?? '',
          study_program: p?.study_program ?? '',
          study_year: p?.study_year ?? '',
        });
      })
      .catch((err) => setError(err.message || 'Could not load profile'));
  }, []);

  useEffect(() => {
    if (!pageRef.current || prefs.reduceMotion) return;
    gsap.fromTo(pageRef.current.querySelectorAll('.profile-anim'), { opacity: 0, y: 10 }, {
      opacity: 1,
      y: 0,
      duration: 0.32,
      stagger: 0.04,
      ease: 'power2.out',
    });
  }, [prefs.reduceMotion]);

  useLayoutEffect(() => {
    const snapshot = layoutSnapshot.current;
    if (!snapshot) return;
    layoutSnapshot.current = null;
    if (prefs.reduceMotion) return;

    panelRefs.current.forEach((node, id) => {
      if (!node || id === draggingPanel) return;
      const before = snapshot.get(id);
      if (!before) return;
      const after = node.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      // FLIP animation: draw the card at its old position, then animate to the new one.
      gsap.fromTo(
        node,
        { x: dx, y: dy },
        { x: 0, y: 0, duration: 0.26, ease: 'power3.out', clearProps: 'transform' },
      );
    });
  }, [panelOrder, draggingPanel, prefs.reduceMotion]);

  const registerPanel = useCallback((id, node) => {
    if (node) panelRefs.current.set(id, node);
    else panelRefs.current.delete(id);
  }, []);

  function capturePanelLayout() {
    // Save card positions before React changes their order.
    layoutSnapshot.current = new Map();
    panelRefs.current.forEach((node, id) => {
      if (node) layoutSnapshot.current.set(id, node.getBoundingClientRect());
    });
  }

  const stats = useMemo(() => makeStats(tasks), [tasks]);
  const initials = (form.display_name || form.username || user?.email || '?').charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url;
  const bannerUrl = profile?.banner_url;
  const profileStyle = useMemo(() => ({
    '--profile-banner-primary': bannerPalette.primary,
    '--profile-banner-secondary': bannerPalette.secondary,
  }) as CSSProperties & Record<string, string>, [bannerPalette]);

  useEffect(() => {
    if (!bannerUrl) {
      setBannerPalette({ primary: '13, 15, 18', secondary: '32, 36, 43' });
      return;
    }

    let active = true;
    extractBannerPalette(bannerUrl)
      .then((palette) => {
        if (active) setBannerPalette(palette);
      })
      .catch(() => {
        if (active) setBannerPalette({ primary: '13, 15, 18', secondary: '32, 36, 43' });
      });
    return () => { active = false; };
  }, [bannerUrl]);

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    setSavingProfile(true);
    if (!prefs.reduceMotion && saveButtonRef.current) {
      gsap.to(saveButtonRef.current, { scale: 0.97, duration: 0.1, ease: 'power2.out' });
    }
    try {
      const updated = await api.profile.update(form);
      setProfile(updated);
      setSaved(true);
      if (!prefs.reduceMotion && saveButtonRef.current) {
        gsap.fromTo(
          saveButtonRef.current,
          { scale: 0.97 },
          { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.45)' },
        );
        gsap.fromTo(
          saveButtonRef.current,
          { boxShadow: '0 0 0 0 rgba(243, 120, 100, 0.45)' },
          { boxShadow: '0 0 0 12px rgba(243, 120, 100, 0)', duration: 0.55, ease: 'power2.out' },
        );
      }
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err.message || 'Could not save profile');
      if (!prefs.reduceMotion && saveButtonRef.current) {
        gsap.fromTo(saveButtonRef.current, { x: -4 }, { x: 0, duration: 0.3, ease: 'elastic.out(1, 0.35)' });
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your avatar.');
      return;
    }

    setError('');
    setCropper(await createCropperState(file, 'avatar'));
  }

  async function changeBanner(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your banner.');
      return;
    }

    setError('');
    setCropper(await createCropperState(file, 'banner'));
  }

  async function saveCroppedImage() {
    if (!cropper) return;
    const isAvatar = cropper.type === 'avatar';
    if (isAvatar) setAvatarSaving(true);
    else setBannerSaving(true);
    try {
      const dataUrl = cropImage(cropper);
      const updated = await api.profile.update({
        ...form,
        [isAvatar ? 'avatar_url' : 'banner_url']: dataUrl,
      });
      setProfile(updated);
      setCropper(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err.message || 'Could not update image');
    } finally {
      if (isAvatar) setAvatarSaving(false);
      else setBannerSaving(false);
    }
  }

  function movePanel(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    capturePanelLayout();
    setPanelOrder((current) => {
      const next = [...current];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      [next[from], next[to]] = [next[to], next[from]];
      localStorage.setItem(PROFILE_PANEL_ORDER_KEY, JSON.stringify(next));
      return next;
    });
  }

  function renderPanel(id) {
    if (id === 'activity') {
      return (
        <DraggablePanel
          key={id}
          id={id}
          draggingPanel={draggingPanel}
          setDraggingPanel={setDraggingPanel}
          movePanel={movePanel}
          registerPanel={registerPanel}
          className="profile-activity-panel"
        >
          <div className="profile-panel-head">
            <h2>Completion Activity</h2>
            <span>last 12 weeks</span>
          </div>
          <GitHubActivity activity={stats.activity} />
        </DraggablePanel>
      );
    }

    if (id === 'pace') {
      return (
        <DraggablePanel
          key={id}
          id={id}
          draggingPanel={draggingPanel}
          setDraggingPanel={setDraggingPanel}
          movePanel={movePanel}
          registerPanel={registerPanel}
        >
          <div className="profile-panel-head">
            <h2>Tasks Completed</h2>
            <span>last 14 days</span>
          </div>
          <PaceChart pace={stats.pace} />
        </DraggablePanel>
      );
    }

    if (id === 'overview') {
      return (
        <DraggablePanel
          key={id}
          id={id}
          draggingPanel={draggingPanel}
          setDraggingPanel={setDraggingPanel}
          movePanel={movePanel}
          registerPanel={registerPanel}
        >
          <div className="profile-panel-head">
            <h2>Student Overview</h2>
            <span>optional</span>
          </div>
          <div className="profile-info-list">
            <InfoRow label="Age" value={form.age || 'Not set'} />
            <InfoRow label="Birthplace" value={form.birthplace || 'Not set'} />
            <InfoRow label="School" value={form.school || 'Not set'} />
            <InfoRow label="Program" value={form.study_program || 'Not set'} />
          </div>
        </DraggablePanel>
      );
    }

    return (
      <DraggablePanel
        key={id}
        id={id}
        as="form"
        className="profile-form"
        onSubmit={saveProfile}
        draggingPanel={draggingPanel}
        setDraggingPanel={setDraggingPanel}
        movePanel={movePanel}
        registerPanel={registerPanel}
      >
        <div className="profile-panel-head">
          <h2>Profile Details</h2>
          {saved && <span className="save-ok">saved</span>}
        </div>
        <label className="field">
          <span>Display name</span>
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </label>
        <label className="field">
          <span>Username</span>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="field">
          <span>Age</span>
          <input type="number" min="1" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </label>
        <label className="field">
          <span>Birthplace</span>
          <input value={form.birthplace} onChange={(e) => setForm({ ...form, birthplace: e.target.value })} />
        </label>
        <label className="field">
          <span>School</span>
          <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
        </label>
        <label className="field">
          <span>Study program</span>
          <input value={form.study_program} onChange={(e) => setForm({ ...form, study_program: e.target.value })} />
        </label>
        <label className="field">
          <span>Study year</span>
          <input value={form.study_year} onChange={(e) => setForm({ ...form, study_year: e.target.value })} />
        </label>
        <label className="field">
          <span>Bio</span>
          <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <button ref={saveButtonRef} className="btn-accent profile-save-btn" type="submit" disabled={savingProfile}>
          {savingProfile ? 'Saving...' : saved ? 'Saved' : 'Save profile'}
        </button>
      </DraggablePanel>
    );
  }

  return (
    <div className="profile-page" ref={pageRef} style={profileStyle}>
      <header className="profile-hero profile-anim">
        <button
          className="profile-banner"
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerSaving}
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
        >
          <span className="profile-banner-hover">{bannerSaving ? 'Saving' : 'Change banner'}</span>
        </button>
        <input
          ref={bannerInputRef}
          className="profile-avatar-input"
          type="file"
          accept="image/*"
          onChange={changeBanner}
        />
        <button
          className="profile-avatar-xl"
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarSaving}
        >
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
          <span className="profile-avatar-hover">{avatarSaving ? 'Saving' : 'Change'}</span>
        </button>
        <input
          ref={avatarInputRef}
          className="profile-avatar-input"
          type="file"
          accept="image/*"
          onChange={changeAvatar}
        />
        <div className="profile-hero-copy">
          <h1>{form.display_name || form.username || 'Student profile'}</h1>
          <p>{form.bio || 'Track your study rhythm, completion pace, and the work you are steadily moving through.'}</p>
          <div className="profile-meta-strip">
            <span>{form.school || 'School not set'}</span>
            <span>{form.study_program || 'Program not set'}</span>
            <span>{form.study_year || 'Study year not set'}</span>
          </div>
        </div>
      </header>

      {error && <div className="form-error profile-anim">{error}</div>}

      <section className="profile-stats profile-anim">
        <Stat label="Completed" value={stats.done} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Streak" value={`${stats.streak}d`} />
      </section>

      <section className="profile-grid">
        {panelOrder.map((id) => renderPanel(id))}
      </section>

      {cropper && (
        <div className="cropper-overlay" onClick={() => setCropper(null)}>
          <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cropper-head">
              <h2>{cropper.type === 'avatar' ? 'Avatar preview' : 'Banner preview'}</h2>
              <button className="btn-ghost" type="button" onClick={() => setCropper(null)}>Cancel</button>
            </div>
            <div className={`cropper-preview cropper-${cropper.type}`}>
              <img
                src={cropper.src}
                alt=""
                style={{
                  transform: `translate(${cropper.x}%, ${cropper.y}%) scale(${cropper.zoom})`,
                }}
              />
            </div>
            <div className="cropper-controls">
              <label>
                <span>Horizontal</span>
                <input type="range" min="-35" max="35" value={cropper.x} onChange={(e) => setCropper({ ...cropper, x: Number(e.target.value) })} />
              </label>
              <label>
                <span>Vertical</span>
                <input type="range" min="-35" max="35" value={cropper.y} onChange={(e) => setCropper({ ...cropper, y: Number(e.target.value) })} />
              </label>
              <label>
                <span>Zoom</span>
                <input type="range" min="1" max="2.2" step="0.01" value={cropper.zoom} onChange={(e) => setCropper({ ...cropper, zoom: Number(e.target.value) })} />
              </label>
            </div>
            <button className="btn-accent" type="button" onClick={saveCroppedImage}>
              Save image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DraggablePanel({
  id,
  as: Tag = 'div',
  className = '',
  children,
  draggingPanel,
  setDraggingPanel,
  movePanel,
  registerPanel,
  ...props
}: any) {
  const isDragging = draggingPanel === id;
  const panelRef = useRef(null);
  const lastHoverTarget = useRef('');

  const setPanelNode = useCallback((node) => {
    panelRef.current = node;
    registerPanel?.(id, node);
  }, [id, registerPanel]);

  function startPanelDrag(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    const node = panelRef.current;
    if (!node) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let currentX = 0;
    let currentY = 0;
    lastHoverTarget.current = '';
    setDraggingPanel(id);

    // Lift the whole card so dragging feels like moving the panel, not only the handle.
    gsap.killTweensOf(node);
    gsap.to(node, {
      scale: 1.018,
      boxShadow: '0 18px 44px rgba(0, 0, 0, 0.34)',
      duration: 0.16,
      ease: 'power2.out',
    });

    function onPointerMove(moveEvent) {
      currentX = moveEvent.clientX - startX;
      currentY = moveEvent.clientY - startY;
      gsap.set(node, { x: currentX, y: currentY, zIndex: 40 });

      node.style.pointerEvents = 'none';
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest?.('.profile-draggable') as HTMLElement | null;
      node.style.pointerEvents = '';
      const targetId = target?.dataset?.panelId || '';

      if (targetId && targetId !== id && targetId !== lastHoverTarget.current) {
        lastHoverTarget.current = targetId;
        // Swap as soon as the held card crosses another card, like rearranging app icons.
        movePanel(id, targetId);
      }
    }

    function onPointerUp(upEvent) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      gsap.to(node, {
        x: 0,
        y: 0,
        scale: 1,
        zIndex: 1,
        boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
        duration: 0.24,
        ease: 'power3.out',
        onComplete: () => {
          gsap.set(node, { clearProps: 'transform,zIndex,boxShadow' });
          setDraggingPanel('');
        },
      });
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return (
    <Tag
      ref={setPanelNode}
      data-panel-id={id}
      className={`profile-panel profile-anim profile-draggable ${className} ${isDragging ? 'dragging' : ''}`}
      {...props}
    >
      <button
        className="profile-drag-handle"
        type="button"
        aria-label="Move profile box"
        title="Move box"
        onPointerDown={startPanelDrag}
      >
        <span />
      </button>
      {children}
    </Tag>
  );
}

function GitHubActivity({ activity }) {
  // The contribution grid groups days into week columns, similar to GitHub activity.
  const weeks = [];
  for (let i = 0; i < activity.length; i += 7) weeks.push(activity.slice(i, i + 7));
  const monthLabels = weeks.map((week, index) => {
    const first = week[0];
    if (!first) return '';
    return index === 0 || first.day <= 7 ? first.month : '';
  });

  return (
    <div className="github-activity">
      <div className="github-months">
        <span />
        {weeks.map((week, index) => (
          <span key={week[0]?.key || index}>{monthLabels[index]}</span>
        ))}
      </div>
      <div className="github-body">
        <div className="github-days">
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
          <span />
        </div>
        <div className="github-grid" aria-label="Task completion activity">
          {weeks.map((week, weekIndex) => (
            <div className="github-week" key={week[0]?.key || weekIndex}>
              {week.map((day) => (
                <span
                  key={day.key}
                  className={`activity-cell level-${Math.min(day.count, 4)}`}
                  title={`${day.label}: ${day.count} completed`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="github-legend">
        <span>Less</span>
        <span className="activity-cell level-0" />
        <span className="activity-cell level-1" />
        <span className="activity-cell level-2" />
        <span className="activity-cell level-3" />
        <span className="activity-cell level-4" />
        <span>More</span>
      </div>
    </div>
  );
}

function createCropperState(file, type): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        resolve({
          type,
          src,
          image: img,
          x: 0,
          y: 0,
          zoom: 1,
          width: type === 'avatar' ? 256 : 1600,
          height: type === 'avatar' ? 256 : 620,
          quality: type === 'avatar' ? 0.82 : 0.82,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function cropImage(cropper) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare image');

  canvas.width = cropper.width;
  canvas.height = cropper.height;

  const targetRatio = cropper.width / cropper.height;
  const sourceRatio = cropper.image.width / cropper.image.height;
  let baseWidth = cropper.image.width;
  let baseHeight = cropper.image.height;

  if (sourceRatio > targetRatio) baseWidth = cropper.image.height * targetRatio;
  else baseHeight = cropper.image.width / targetRatio;

  const cropWidth = baseWidth / cropper.zoom;
  const cropHeight = baseHeight / cropper.zoom;
  const maxX = Math.max(0, cropper.image.width - cropWidth);
  const maxY = Math.max(0, cropper.image.height - cropHeight);
  const centerX = maxX / 2;
  const centerY = maxY / 2;
  const sx = clamp(centerX - (cropper.x / 70) * maxX, 0, maxX);
  const sy = clamp(centerY - (cropper.y / 70) * maxY, 0, maxY);

  ctx.drawImage(cropper.image, sx, sy, cropWidth, cropHeight, 0, 0, cropper.width, cropper.height);
  return canvas.toDataURL('image/jpeg', cropper.quality);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

type BannerPalette = {
  primary: string;
  secondary: string;
};

function extractBannerPalette(src): Promise<BannerPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Could not read banner colors'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not sample banner colors'));
        return;
      }

      canvas.width = 72;
      canvas.height = 36;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const left = averageRegion(data, canvas.width, canvas.height, 0, 36);
      const right = averageRegion(data, canvas.width, canvas.height, 36, 72);
      resolve({ primary: left, secondary: right });
    };
    img.src = src;
  });
}

function averageRegion(data, width, height, xStart, xEnd) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = xStart; x < xEnd; x += 2) {
      const i = (y * width + x) * 4;
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 18) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
  }

  if (!count) return '13, 15, 18';
  return `${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`;
}

function Stat({ label, value }) {
  return (
    <div className="profile-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="profile-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PaceChart({ pace }) {
  return (
    <div className="pace-chart" role="img" aria-label="Completion pace chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pace} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="doneFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f37864" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#f37864" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#8a94a6', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8a94a6', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#0d0f12', border: '1px solid #2c323b', color: '#fff' }}
            labelStyle={{ color: '#d6dbe3' }}
          />
          <Area type="monotone" dataKey="done" name="Completed" stroke="#f37864" strokeWidth={3} fill="url(#doneFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function makeStats(tasks) {
  // Build all profile metrics from the current task list.
  const today = startDay(new Date());
  const doneTasks = tasks.filter((task) => task.status === 'done');
  const open = tasks.filter((task) => task.status !== 'done').length;
  const overdue = tasks.filter((task) => task.status !== 'done' && task.deadline && new Date(task.deadline) < new Date()).length;

  const byDate = new Map();
  for (const task of doneTasks) {
    const d = startDay(new Date(task.deadline || task.start_time || task.created_at));
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) || 0) + 1);
  }

  const activity = Array.from({ length: 182 }, (_, i) => {
    const d = new Date(today.getTime() - (181 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      day: d.getDate(),
      count: byDate.get(key) || 0,
    };
  });

  let streak = 0;
  for (let i = activity.length - 1; i >= 0; i -= 1) {
    if (activity[i].count === 0) break;
    streak += 1;
  }

  const pace = activity.slice(-14).map((day) => ({ label: day.label, done: day.count }));

  return { done: doneTasks.length, open, overdue, streak, activity, pace };
}

function startDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
