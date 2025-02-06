document.addEventListener('DOMContentLoaded', function() {
    const skillButtons = document.querySelectorAll('.skill-button');
    const skillDetails = document.getElementById('skill-details');

    if (skillButtons.length > 0 && skillDetails) {
        skillButtons.forEach(button => {
            button.addEventListener('click', function() {
                skillButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const selectedSkill = this.getAttribute('data-skill');
                displaySkillDetails(selectedSkill);
            });
        });
    }
});

function displaySkillDetails(skillCategory) {
    const skills = {
        'core-areas': [
            'Artificial Intelligence (AI)',
            'ChatGPT and Generative AI',
            'OpenAI API',
            'Natural Language Processing (NLP)',
            'Robotic Process Automation (RPA)',
            'Large Language Models (LLM)',
            'Computer Vision',
            'Machine Learning',
            'Deep Learning',
            'Reinforcement Learning'
        ],
        'business-skills': [
            'Business Strategy',
            'Business Development',
            'Entrepreneurship',
            'Marketing Strategy',
            'Digital Marketing',
            'Online Marketing',
            'Affiliate Marketing',
            'Customer Acquisition',
            'Digital Strategy',
            'Branding'
        ],
        'technical-skills': [
            'Python',
            'Web Design (HTML5, JavaScript, CSS)',
            'SEO',
            'UX/UI',
            'Network Security',
            'Fraud Investigations',
            'Online Gaming Security',
            'Data Analysis'
        ],
        'gaming-industry': [
            'Online Gaming',
            'Online Poker',
            'Casino',
            'Poker Blogs',
            'Poker Tools',
            'Poker Education',
            'Poker Security',
            'Chargebacks'
        ],
        'notable-skills': [
            'Project Management',
            'Team Management & Leadership',
            'Employee Training',
            'Storytelling',
            'Editing & Proofreading',
            'PowerPoint Presentations',
            'Excel Formulas',
            'Online Journalism',
            'Financial Analysis'
        ]
    };

    const skillDetails = document.getElementById('skill-details');
    if (skillDetails) {
        const selectedSkills = skills[skillCategory];
        if (selectedSkills) {
            let skillHTML = `<h3>${skillCategory.replace(/-/g, ' ').toUpperCase()}</h3><ul class="skill-list">`;
            selectedSkills.forEach(skillName => {
                skillHTML += `<li>${skillName}</li>`;
            });
            skillHTML += '</ul>';
            skillDetails.innerHTML = skillHTML;
        } else {
            skillDetails.innerHTML = '<p>No skills found for the selected category.</p>';
        }
    }
}

// Debugging
console.log('about.js loaded');
document.querySelectorAll('.skill-button').forEach(button => {
    console.log('Button:', button.textContent);
});