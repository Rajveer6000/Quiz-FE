/**
 * SectionTabs Component
 * Tabs for switching between test sections
 */

const SectionTabs = ({
  sections,
  activeSectionIndex,
  onSectionChange,
}) => {
  return (
    <div className="flex overflow-x-auto border-b border-glass-border">
      {sections.map((section, index) => (
        <button
          key={section.testSectionId || index}
          onClick={() => onSectionChange(index)}
          className={activeSectionIndex === index ? 'section-tab-active' : 'section-tab'}
        >
          <div className="flex items-center gap-2">
            <span>{section.sectionName}</span>
            <span className="text-xs opacity-60">
              ({section.questionsAttempted || 0}/{section.questionsInSection || section.questions?.length || 0})
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SectionTabs;
