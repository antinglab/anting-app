'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CrewMember {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  region: string;
  userType: string;
  resultType: string;
  status?: string;
  memo?: string;
  createdAt: Timestamp;
  source?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'brand' | 'influencer'>('all');
  const [selected, setSelected] = useState<CrewMember | null>(null);

  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      const q = query(
        collection(db, 'crew_members'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CrewMember[];
      setCrews(data);
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'crew_members', id), { status });
      setCrews((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const saveMemo = async (id: string, memo: string) => {
    try {
      await updateDoc(doc(db, 'crew_members', id), { memo });
      setCrews((prev) =>
        prev.map((c) => (c.id === id ? { ...c, memo } : c))
      );
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const deleteCrew = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'crew_members', id));
      setCrews((prev) => prev.filter((c) => c.id !== id));
      setSelected(null);
    } catch (error) {
      console.error('크루 삭제 실패:', error);
    }
  };

  const exportCSV = () => {
    const bom = '\uFEFF';
    const header = '번호,이름,생년월일,성별,연락처,이메일,지역,유형,진단결과,상태,메모,가입일\n';
    const rows = filteredCrews.map((c, i) => {
      const date = c.createdAt?.toDate?.()
        ? c.createdAt.toDate().toLocaleString('ko-KR')
        : '';
      return [
        i + 1, c.name, c.birthDate,
        c.gender === 'male' ? '남성' : c.gender === 'female' ? '여성' : '미선택',
        c.phone, c.email, c.region, c.userType, c.resultType,
        c.status || '대기중', c.memo || '', date,
      ]
        .map((v) => `"${v}"`)
        .join(',');
    });
    const blob = new Blob([bom + header + rows.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anting-crew-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredCrews = crews.filter((c) => {
    const matchSearch =
      c.name?.includes(search) || c.email?.includes(search);
    const matchFilter =
      filter === 'all' || c.userType === filter;
    return matchSearch && matchFilter;
  });

  const brandCount = crews.filter((c) => c.userType === 'brand').length;
  const infCount = crews.filter((c) => c.userType === 'influencer').length;

  const statusColor: Record<string, string> = {
    대기중: '#6B6B6B',
    연락완료: '#3B82F6',
    전환완료: '#6B7C3F',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#F7F6F1' }}>
        <p style={{ color: '#6B7C3F', fontSize: 18 }}>데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1',
      fontFamily: 'Pretendard, sans-serif' }}>
      
      {/* 사이드바 */}
      <div style={{ position: 'fixed', left: 0, top: 0, width: 200,
        height: '100vh', background: '#3D4A22', padding: '24px 16px',
        display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: 'white', fontFamily: 'Georgia',
          fontSize: 22, marginBottom: 4, fontStyle: 'italic' }}>anting</h1>
        <p style={{ color: '#D4DBA8', fontSize: 10,
          marginBottom: 32, letterSpacing: 2 }}>ADMIN</p>
        <nav style={{ flex: 1 }}>
          {[
            { label: '대시보드', path: '/admin/dashboard' },
          ].map((item) => (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{ padding: '10px 12px', borderRadius: 8,
                color: 'white', cursor: 'pointer', marginBottom: 4,
                background: '#6B7C3F', fontSize: 14 }}>
              {item.label}
            </div>
          ))}
        </nav>
        <button
          onClick={() => {
            sessionStorage.removeItem('anting-admin');
            router.push('/admin/login');
          }}
          style={{ padding: '10px', background: 'transparent',
            border: '1px solid #6B7C3F', borderRadius: 8,
            color: '#D4DBA8', cursor: 'pointer', fontSize: 13 }}>
          로그아웃
        </button>
      </div>

      {/* 메인 */}
      <div style={{ marginLeft: 200, padding: '32px 28px' }}>
        <h2 style={{ color: '#3D4A22', fontSize: 22, fontWeight: 700,
          marginBottom: 24 }}>앤팅크루 관리</h2>

        {/* KPI 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 28 }}>
          {[
            { label: '전체 크루', value: crews.length, color: '#6B7C3F' },
            { label: '광고주', value: brandCount, color: '#3D4A22' },
            { label: '인플루언서', value: infCount, color: '#C8B84A' },
          ].map((card) => (
            <div key={card.label} style={{ background: 'white',
              borderRadius: 16, padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <p style={{ color: '#6B6B6B', fontSize: 13,
                marginBottom: 8 }}>{card.label}</p>
              <p style={{ color: card.color, fontSize: 36,
                fontWeight: 700, fontFamily: 'Georgia' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* 검색 & 필터 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16,
          alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="이름 또는 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid #D4DBA8', fontSize: 14,
              outline: 'none', width: 220 }}
          />
          {(['all', 'brand', 'influencer'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding: '8px 16px', borderRadius: 999,
                border: filter === f ? 'none' : '1.5px solid #D4DBA8',
                background: filter === f ? '#6B7C3F' : 'white',
                color: filter === f ? 'white' : '#6B6B6B',
                cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {f === 'all' ? '전체' : f === 'brand' ? '광고주' : '인플루언서'}
            </button>
          ))}
          <button
            onClick={exportCSV}
            style={{ marginLeft: 'auto', padding: '8px 18px',
              borderRadius: 999, background: '#C8B84A',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700 }}>
            CSV 내보내기
          </button>
        </div>

        {/* 테이블 */}
        <div style={{ background: 'white', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#3D4A22' }}>
                {['이름', '유형', '연락처', '이메일', '지역', '진단유형', '상태', '가입일', '액션']
                  .map((h) => (
                    <th key={h} style={{ padding: '12px 14px',
                      color: 'white', fontSize: 12,
                      fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filteredCrews.map((crew, i) => (
                <tr key={crew.id}
                  style={{ borderBottom: '1px solid #F0F0F0',
                    background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={{ padding: '11px 14px', fontSize: 14,
                    fontWeight: 600, color: '#3D4A22', cursor: 'pointer' }}
                    onClick={() => setSelected(crew)}>
                    {crew.name}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      background: crew.userType === 'brand' ? '#D4DBA8' : '#FEF3C7',
                      color: crew.userType === 'brand' ? '#3D4A22' : '#92400E' }}>
                      {crew.userType === 'brand' ? '광고주' : '인플루언서'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13,
                    color: '#444' }}>{crew.phone}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12,
                    color: '#6B6B6B' }}>{crew.email}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13,
                    color: '#444' }}>{crew.region}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12,
                    color: '#6B6B6B' }}>{crew.resultType}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <select
                      value={crew.status || '대기중'}
                      onChange={(e) => updateStatus(crew.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 8,
                        border: '1px solid #D4DBA8', fontSize: 12,
                        color: statusColor[crew.status || '대기중'],
                        cursor: 'pointer', outline: 'none' }}>
                      {['대기중', '연락완료', '전환완료'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 11,
                    color: '#9CA3AF' }}>
                    {crew.createdAt?.toDate?.()
                      ? crew.createdAt.toDate().toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button
                      onClick={() => deleteCrew(crew.id)}
                      style={{ padding: '4px 10px', borderRadius: 6,
                        border: '1px solid #FCA5A5', background: 'white',
                        color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCrews.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 40,
                    textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    등록된 크루가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 상세 슬라이드오버 */}
        {selected && (
          <div style={{ position: 'fixed', right: 0, top: 0,
            width: 340, height: '100vh', background: 'white',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            padding: '28px 24px', overflowY: 'auto', zIndex: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ color: '#3D4A22', fontSize: 18,
                fontWeight: 700 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none',
                  fontSize: 20, cursor: 'pointer', color: '#6B6B6B' }}>
                ✕
              </button>
            </div>
            {[
              { label: '유형', value: selected.userType === 'brand' ? '광고주' : '인플루언서' },
              { label: '생년월일', value: selected.birthDate },
              { label: '성별', value: selected.gender === 'male' ? '남성' : selected.gender === 'female' ? '여성' : '미선택' },
              { label: '연락처', value: selected.phone },
              { label: '이메일', value: selected.email },
              { label: '지역', value: selected.region },
              { label: '진단 유형', value: selected.resultType },
              { label: '가입 출처', value: selected.source || '-' },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF',
                  marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 14, color: '#3D4A22',
                  fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>
                메모
              </p>
              <textarea
                defaultValue={selected.memo || ''}
                onBlur={(e) => saveMemo(selected.id, e.target.value)}
                rows={4}
                placeholder="메모를 입력하세요"
                style={{ width: '100%', padding: '10px 12px',
                  borderRadius: 10, border: '1.5px solid #D4DBA8',
                  fontSize: 13, outline: 'none', resize: 'none',
                  boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={() => deleteCrew(selected.id)}
              style={{ marginTop: 16, width: '100%', padding: '12px',
                background: 'white', border: '1.5px solid #FCA5A5',
                borderRadius: 12, color: '#EF4444',
                fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
              크루 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
