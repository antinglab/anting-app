'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import app from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Campaign } from '@/types';
import { AlertTriangle, Sparkles, Copy, ExternalLink, ArrowLeft } from 'lucide-react';

export default function CreatePostPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'instagram' | 'blog'>('instagram');
  const [charCount, setCharCount] = useState(0);
  const [hasAdTag, setHasAdTag] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setCharCount(text.length);
      setHasAdTag(text.includes('#광고') || text.includes('#협찬'));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[400px] border border-gray-200 rounded-xl p-4 bg-white',
      },
    },
  });

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const campRef = doc(db, 'campaigns', campaignId);
        const campSnap = await getDoc(campRef);
        if (campSnap.exists()) {
          setCampaign({ id: campSnap.id, ...campSnap.data() } as Campaign);
        } else {
          // 테스트를 위한 임시 목업 데이터
          setCampaign({
            id: campaignId || 'test-123',
            title: '[테스트] 올리브 프리미엄 비건 스킨케어',
            guidelines: '1. 제품 패키지의 고급스러움과 친환경적인 느낌을 강조해주세요.\n2. 순한 비건 성분으로 피부 자극이 없다는 점을 어필해주세요.\n3. 얼굴에 직접 발라보는 사용감 사진이 1장 이상 꼭 들어가야 합니다.',
            requiredHashtags: ['#비건화장품', '#올리브스킨케어', '#순한화장품'],
            forbiddenWords: ['비싸다', '별로다', '단점'],
            status: 'recruiting',
            createdAt: Timestamp.now()
          } as Campaign);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const handleGenerateDraft = async () => {
    if (!campaign) return;
    setGenerating(true);
    try {
      const functions = getFunctions(app, 'asia-northeast3');
      const generatePostDraft = httpsCallable(functions, 'generatePostDraft');
      const response = await generatePostDraft({
        campaignGuide: campaign.guidelines,
        productName: campaign.title,
        requiredPhrases: '',
        requiredHashtags: campaign.requiredHashtags?.join(' ') || ''
      });
      
      const data = response.data as { 
        instagram?: { caption?: string; hashtags?: string[] };
        blog?: { title?: string; content?: string };
      };
      if (activeTab === 'instagram') {
        const text = `${data.instagram?.caption || ''}\n\n${(data.instagram?.hashtags || []).join(' ')}`;
        editor?.commands.setContent(`<p>${text.replace(/\n/g, '<br/>')}</p>`);
      } else {
        const text = `<h2>${data.blog?.title || ''}</h2><p>${data.blog?.content?.replace(/\n/g, '<br/>') || ''}</p>`;
        editor?.commands.setContent(text);
      }
      
      const newText = editor?.getText() || '';
      setCharCount(newText.length);
      setHasAdTag(newText.includes('#광고') || newText.includes('#협찬'));

    } catch (error) {
      console.error(error);
      alert('초안 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const insertAdTag = () => {
    editor?.commands.insertContent(' #광고 ');
    setHasAdTag(true);
  };

  const handleCopy = () => {
    const text = editor?.getText() || '';
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  if (loading) return <div className="text-center py-20">로딩 중...</div>;
  if (!campaign) return <div className="text-center py-20">캠페인을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 font-pretendard">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        돌아가기
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-olive-dark">포스팅 생성기</h1>
        <button
          onClick={handleGenerateDraft}
          disabled={generating}
          className="bg-olive hover:bg-olive-light text-white px-6 py-2 rounded-full font-bold flex items-center transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? '생성 중...' : 'AI 초안 생성하기 ✨'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Guidelines */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[700px] overflow-y-auto">
          <h2 className="text-lg font-bold text-olive-dark mb-4">원고 가이드 체크리스트</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-2 text-olive">가이드라인</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-neutral p-4 rounded-xl">
                {campaign.guidelines}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-2 text-olive">필수 해시태그</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.requiredHashtags?.map(tag => (
                  <span key={tag} className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {campaign.forbiddenWords && campaign.forbiddenWords.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2 text-red-500">금지어</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.forbiddenWords.map(word => (
                    <span key={word} className="bg-red-50 px-2 py-1 rounded-md text-xs font-medium text-red-600">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[700px]">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('instagram')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeTab === 'instagram' ? 'bg-olive text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              인스타그램
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeTab === 'blog' ? 'bg-olive text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              네이버 블로그
            </button>
          </div>

          {!hasAdTag && (
            <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span>필수 해시태그(#광고, #협찬)가 포함되어 있지 않습니다!</span>
              </div>
              <button 
                onClick={insertAdTag}
                className="text-xs font-bold bg-orange-100 px-2 py-1 rounded hover:bg-orange-200"
              >
                자동 삽입
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto mb-4 relative">
             <EditorContent editor={editor} className="h-full" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              글자 수: <span className="font-bold text-olive-dark">{charCount}</span>자
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                내용 복사
              </button>
              <button
                onClick={() => router.push(`/my-campaigns/${campaignId}`)}
                className="flex items-center px-4 py-2 bg-olive hover:bg-olive-light text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                URL 제출하러 가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
