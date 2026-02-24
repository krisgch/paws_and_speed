import useStore from '../../store/useStore.ts';
import SizeFilter from '../../components/SizeFilter.tsx';
import CourseInfoBar from '../../components/CourseInfoBar.tsx';
import CourseTimePanel from './CourseTimePanel.tsx';
import ScoringQueue from './ScoringQueue.tsx';
import ScoringForm from './ScoringForm.tsx';

export default function Scoring() {
  const { scoringSizeFilter, setScoringSizeFilter } = useStore();

  return (
    <div>
      <CourseTimePanel />

      <SizeFilter
        mode="single"
        activeSingle={scoringSizeFilter}
        onSelectSingle={setScoringSizeFilter}
      />
      <CourseInfoBar />

      <div className="grid gap-5 max-[900px]:grid-cols-1" style={{ gridTemplateColumns: '320px 1fr' }}>
        <ScoringQueue />
        <ScoringForm />
      </div>
    </div>
  );
}
