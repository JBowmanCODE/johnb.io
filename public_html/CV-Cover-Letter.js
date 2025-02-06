// Progress tracking variables
let progress = 0;
const progressSteps = [
    'Analyzing inputs...',
    'Processing job description...',
    'Tailoring CV...',
    'Crafting cover letter...',
    'Finalizing documents...'
];

// Utility Functions
function extractUserDetails(cvText) {
    const details = {
        name: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        jobTitle: ''
    };
    
    // Extract email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const emailMatch = cvText.match(emailRegex);
    if (emailMatch) details.email = emailMatch[0];
    
    // Extract phone
    const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/;
    const phoneMatch = cvText.match(phoneRegex);
    if (phoneMatch) details.phone = phoneMatch[0];
    
    // Extract LinkedIn URL
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/;
    const linkedinMatch = cvText.match(linkedinRegex);
    if (linkedinMatch) details.linkedin = linkedinMatch[0];
    
    // Extract name (assuming it's at the start of the CV)
    const nameMatch = cvText.split('\n')[0].trim().replace(/\*\*/g, '');
    if (nameMatch) details.name = nameMatch;

    // Extract location/address
    const addressRegex = /(?:\d{1,5}\s)?[A-Za-z0-9\s,.-]+(?:Avenue|Lane|Road|Boulevard|Drive|Street|Ave|Dr|Rd|Blvd|Ln|St)\.?|(?:[A-Za-z]+,\s*[A-Za-z]+)/i;
    const addressMatch = cvText.match(addressRegex);
    if (addressMatch) details.address = addressMatch[0].trim();

    // Extract current job title
    const jobTitleRegex = /Head of|Senior|Manager|Director/i;
    const jobTitleMatch = cvText.match(jobTitleRegex);
    if (jobTitleMatch) {
        const titleLine = cvText.split('\n').find(line => line.includes(jobTitleMatch[0]));
        if (titleLine) {
            details.jobTitle = titleLine.split(',')[0].trim();
        }
    }
    
    return details;
}

function formatContent(content, type, userDetails) {
    // Helper function to format section headers
    const formatHeader = (text) => `**${text}**\n\n`;

    // Helper function to format bullet points
    const formatBullet = (text, isTitle = false) => {
        const bulletText = text.trim().replace(/^[-•]\s*/, '');
        return isTitle ? 
            `- **${bulletText}**\n` : 
            `- ${bulletText}\n`;
    };

    let formattedContent = '';

    if (type === 'cv') {
        // Header section
        const keySkills = extractKeySkills(content);
        formattedContent += `**${userDetails.name}**\n`;
        formattedContent += `${userDetails.jobTitle} | ${keySkills.slice(0, 3).join(' | ')}\n`;
        formattedContent += `LinkedIn: ${userDetails.linkedin} | Email: ${userDetails.email} | Phone: ${userDetails.phone}\n\n`;

        // Professional Summary
        formattedContent += formatHeader('PROFESSIONAL SUMMARY');
        const summaryMatch = content.match(/PROFESSIONAL SUMMARY([\s\S]*?)(?=AREAS OF EXPERTISE|$)/i);
        if (summaryMatch) {
            formattedContent += `${summaryMatch[1].trim()}\n\n`;
        }

        // Areas of Expertise
        formattedContent += formatHeader('AREAS OF EXPERTISE');
        const expertiseMatch = content.match(/AREAS OF EXPERTISE([\s\S]*?)(?=CAREER HIGHLIGHTS|PROFESSIONAL EXPERIENCE|$)/i);
        if (expertiseMatch) {
            const expertise = expertiseMatch[1].match(/[•-]\s*(.*)/g);
            expertise?.forEach(item => {
                const [title, ...description] = item.replace(/[•-]\s*/, '').split(/:\s*/);
                if (description.length > 0) {
                    formattedContent += formatBullet(`${title}: ${description.join(': ')}`, true);
                } else {
                    formattedContent += formatBullet(title, true);
                }
            });
        }
        formattedContent += '\n';

        // Career Highlights
        formattedContent += formatHeader('CAREER HIGHLIGHTS');
        const highlightsMatch = content.match(/CAREER HIGHLIGHTS([\s\S]*?)(?=PROFESSIONAL EXPERIENCE|$)/i);
        if (highlightsMatch) {
            const highlights = highlightsMatch[1].match(/[•-]\s*(.*)/g);
            highlights?.forEach(item => {
                formattedContent += formatBullet(item, true);
            });
        }
        formattedContent += '\n';

        // Professional Experience
        formattedContent += formatHeader('PROFESSIONAL EXPERIENCE');
        const experienceMatch = content.match(/PROFESSIONAL EXPERIENCE([\s\S]*?)(?=PRIOR CAREER ROLES|EDUCATION|$)/i);
        if (experienceMatch) {
            const experiences = experienceMatch[1].split(/(?=(?:Head of|Senior|Manager|Director).*?,)/g);
            experiences.forEach(exp => {
                if (exp.trim()) {
                    // Extract job details
                    const lines = exp.trim().split('\n');
                    const jobLine = lines[0];
                    const [title, company, location, dates] = jobLine.split(',').map(s => s.trim());
                    
                    // Format job header
                    formattedContent += `**${title}, ${company}, ${location}, ${dates}**\n\n`;
                    
                    // Add description and responsibilities
                    lines.slice(1).forEach(line => {
                        if (line.trim()) {
                            if (line.trim().startsWith('•')) {
                                formattedContent += formatBullet(line, true);
                            } else {
                                formattedContent += `${line.trim()}\n\n`;
                            }
                        }
                    });
                }
            });
        }

        // Prior Career Roles
        formattedContent += formatHeader('PRIOR CAREER ROLES');
        const priorRolesMatch = content.match(/PRIOR CAREER ROLES([\s\S]*?)(?=EDUCATION|$)/i);
        if (priorRolesMatch) {
            const roles = priorRolesMatch[1].match(/[•-]\s*(.*)/g);
            roles?.forEach(role => {
                formattedContent += formatBullet(role, true);
            });
        }
        formattedContent += '\n';

        // Education
        formattedContent += formatHeader('EDUCATION');
        const educationMatch = content.match(/EDUCATION([\s\S]*?)(?=\n\n|$)/i);
        if (educationMatch) {
            const education = educationMatch[1].match(/[•-]\s*(.*)/g);
            education?.forEach(item => {
                formattedContent += formatBullet(item, true);
            });
        }
    } else {
        // Cover letter formatting
        const paragraphs = content.split('\n\n');
        paragraphs.forEach(para => {
            if (para.trim()) {
                formattedContent += `${para.trim()}\n\n`;
            }
        });
    }

    return formattedContent;
}

// Helper function to extract key skills
function extractKeySkills(content) {
    const expertiseMatch = content.match(/AREAS OF EXPERTISE([\s\S]*?)(?=CAREER HIGHLIGHTS|PROFESSIONAL EXPERIENCE|$)/i);
    if (expertiseMatch) {
        const skills = expertiseMatch[1].match(/[•-]\s*(.*?)(?::|$)/gm);
        return skills
            ?.map(skill => skill.replace(/[•-]\s*/, '').replace(/:.*$/, '').trim())
            .filter(Boolean)
            .slice(0, 3) || [];
    }
    return [];
}
// Utility functions continued
function htmlToPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    let text = temp.textContent || temp.innerText;
    
    // Clean up the text
    text = text
        .replace(/\s+/g, ' ')      // Collapse multiple spaces
        .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
        .replace(/\[|\]/g, '')     // Remove brackets
        .trim();
    
    return text;
}

function updateCharCount(textarea, counterId) {
    const counter = document.getElementById(counterId);
    const maxLength = parseInt(textarea.getAttribute('maxlength')) || 5000;
    const currentLength = textarea.value.length;
    const remaining = maxLength - currentLength;
    
    counter.textContent = `${remaining.toLocaleString()} characters remaining`;
    
    if (remaining < maxLength * 0.1) {
        counter.style.color = '#dc3545';
    } else if (remaining < maxLength * 0.2) {
        counter.style.color = '#ffc107';
    } else {
        counter.style.color = '#666';
    }
}

// Error Handling and UI Functions
function showError(message, duration = 5000) {
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    
    if (!errorContainer || !errorText) {
        console.error('Error elements not found');
        return;
    }
    
    errorText.textContent = message;
    errorContainer.style.display = 'block';
    errorContainer.style.animation = 'slideIn 0.3s ease-out';
    
    if (duration > 0) {
        setTimeout(() => closeError(), duration);
    }
}

function closeError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 300);
    }
}

function updateProgress(step) {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.generating-text');
    const generatingState = document.querySelector('.generating-state');
    
    if (!progressBar || !progressText || !generatingState) {
        console.error('Progress elements not found');
        return;
    }
    
    progress = (step / (progressSteps.length - 1)) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = progressSteps[step];
    generatingState.style.display = 'flex';
}

// DOCX Generation
async function generateDOCX(content, type, userDetails) {
    const {
        Document,
        Paragraph,
        TextRun,
        AlignmentType,
        convertInchesToTwip,
        HeadingLevel,
        spacing,
        TabStopPosition,
        TabStopType
    } = window.docx;

    function createParagraph(text, options = {}) {
        if (!text?.trim()) return null;

        const runs = [];
        
        // Handle bold sections marked with **
        const boldSections = text.split(/(\*\*.*?\*\*)/g);
        boldSections.forEach(section => {
            if (section.startsWith('**') && section.endsWith('**')) {
                runs.push(
                    new TextRun({
                        text: section.replace(/\*\*/g, ''),
                        bold: true,
                        size: options.size || 24,
                        font: "Calibri",
                    })
                );
            } else if (section.trim()) {
                if (section.includes('|')) {
                    // Handle separator lines (like in header)
                    section.split('|').forEach((part, index, array) => {
                        runs.push(
                            new TextRun({
                                text: part.trim(),
                                bold: options.bold,
                                size: options.size || 24,
                                font: "Calibri",
                            })
                        );
                        if (index < array.length - 1) {
                            runs.push(
                                new TextRun({
                                    text: " | ",
                                    size: options.size || 24,
                                    font: "Calibri",
                                })
                            );
                        }
                    });
                } else {
                    runs.push(
                        new TextRun({
                            text: section,
                            bold: options.bold,
                            size: options.size || 24,
                            font: "Calibri",
                        })
                    );
                }
            }
        });

        return new Paragraph({
            children: runs,
            spacing: {
                before: options.spacingBefore || 120,
                after: options.spacingAfter || 120,
                line: options.lineSpacing || 360,
            },
            alignment: options.alignment || AlignmentType.LEFT,
            bullet: options.bullet ? {
                level: 0
            } : undefined,
            indent: options.indent ? {
                left: convertInchesToTwip(0.5),
                hanging: options.bullet ? convertInchesToTwip(0.25) : 0
            } : undefined
        });
    }

    function createBullet(text, options = {}) {
        if (!text?.trim()) return null;

        const runs = [];
        
        // Handle title and description in bullets
        const [title, ...description] = text.split(/:\s*/);
        
        runs.push(
            new TextRun({
                text: "• ",
                size: options.size || 24,
                font: "Calibri",
            })
        );

        runs.push(
            new TextRun({
                text: title,
                bold: true,
                size: options.size || 24,
                font: "Calibri",
            })
        );

        if (description.length > 0) {
            runs.push(
                new TextRun({
                    text: `: ${description.join(': ')}`,
                    size: options.size || 24,
                    font: "Calibri",
                })
            );
        }

        return new Paragraph({
            children: runs,
            spacing: {
                before: 120,
                after: 120,
                line: 360,
            },
            indent: {
                left: convertInchesToTwip(0.5),
                hanging: convertInchesToTwip(0.25)
            }
        });
    }

    const children = [];

    if (type === 'cv') {
        // Header section with name and key skills
        children.push(
            createParagraph(userDetails.name, {
                bold: true,
                size: 32,
                spacingAfter: 160
            })
        );

        // Job title and key skills
        const keySkills = extractKeySkills(content);
        children.push(
            createParagraph(`${userDetails.jobTitle} | ${keySkills.join(' | ')}`, {
                size: 24,
                spacingAfter: 160
            })
        );

        // Contact info
        children.push(
            createParagraph(`LinkedIn: ${userDetails.linkedin} | Email: ${userDetails.email} | Phone: ${userDetails.phone}`, {
                size: 24,
                spacingAfter: 400
            })
        );

        // Process sections
        const sections = content.split(/(?=\*\*[A-Z\s]+\*\*)/);
        sections.forEach(section => {
            if (section.trim()) {
                const headerMatch = section.match(/\*\*(.*?)\*\*/);
                if (headerMatch) {
                    const header = headerMatch[1].trim();
                    
                    // Add section header
                    children.push(
                        createParagraph(header, {
                            bold: true,
                            size: 28,
                            spacingBefore: 360,
                            spacingAfter: 240
                        })
                    );

                    // Process section content
                    const contentText = section.replace(/\*\*.*?\*\*/, '').trim();
                    if (contentText) {
                        // Split content into paragraphs
                        const paragraphs = contentText.split('\n');
                        paragraphs.forEach(para => {
                            if (para.trim()) {
                                if (para.trim().startsWith('-') || para.trim().startsWith('•')) {
                                    // Handle bullet points
                                    children.push(
                                        createBullet(para.replace(/^[-•]\s*/, ''), {
                                            size: 24
                                        })
                                    );
                                } else {
                                    // Handle regular paragraphs
                                    children.push(
                                        createParagraph(para, {
                                            size: 24,
                                            spacingAfter: 240
                                        })
                                    );
                                }
                            }
                        });
                    }
                }
            }
        });
    }

    // Create document with proper margins
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1),
                        right: convertInchesToTwip(1)
                    }
                }
            },
            children: children.filter(Boolean)
        }]
    });

    return docx.Packer.toBlob(doc);
}
// Document download handler
async function downloadDocument(type, format) {
    const contentElement = document.getElementById(type === 'cv' ? 'generatedCV' : 'generatedCoverLetter');
    const button = event.target.closest('.action-button');
    
    if (!contentElement || !button) {
        showError('Content not found');
        return;
    }
    
    try {
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<div class="spinner"></div> Preparing...`;
        
        const content = contentElement.innerHTML;
        const userDetails = extractUserDetails(document.getElementById('cvText').value);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${type}_${timestamp}.${format}`;
        
        let blob;
        switch (format) {
            case 'docx':
                blob = await generateDOCX(content, type, userDetails);
                break;
            case 'txt':
                const plainText = htmlToPlainText(content);
                blob = new Blob([plainText], { type: 'text/plain' });
                break;
            default:
                throw new Error('Unsupported format');
        }
        
        // Create and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success state
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            Done!
        `;
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Download failed:', error);
        showError(`Failed to download ${format.toUpperCase()} file`);
        button.innerHTML = originalContent;
        button.disabled = false;
    }
}

// Clipboard operations
async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const button = event.target.closest('.action-button');
    
    if (!element || !button) {
        console.error('Required elements not found');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(element.textContent);
        
        const originalContent = button.innerHTML;
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg> 
            Copied!
        `;
        button.style.backgroundColor = '#218838';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Copy failed:', err);
        showError('Failed to copy to clipboard');
    }
}

// Initialize form handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('generateForm');
    const jobDescriptionInput = document.getElementById('jobDescription');
    const cvTextInput = document.getElementById('cvText');
    
    if (!form || !jobDescriptionInput || !cvTextInput) {
        console.error('Required form elements not found');
        return;
    }
    
    // Save form inputs to localStorage
    function saveInputsToLocalStorage() {
        localStorage.setItem('jobDescription', jobDescriptionInput.value);
        localStorage.setItem('cvText', cvTextInput.value);
    }
    
    // Restore form inputs from localStorage
    function restoreInputsFromLocalStorage() {
        const savedJobDescription = localStorage.getItem('jobDescription');
        const savedCvText = localStorage.getItem('cvText');
        
        if (savedJobDescription) {
            jobDescriptionInput.value = savedJobDescription;
            updateCharCount(jobDescriptionInput, 'jobDescCounter');
        }
        
        if (savedCvText) {
            cvTextInput.value = savedCvText;
            updateCharCount(cvTextInput, 'cvTextCounter');
        }
    }
    
    // Set up auto-save
    jobDescriptionInput.addEventListener('input', () => {
        updateCharCount(jobDescriptionInput, 'jobDescCounter');
        saveInputsToLocalStorage();
    });

    cvTextInput.addEventListener('input', () => {
        updateCharCount(cvTextInput, 'cvTextCounter');
        saveInputsToLocalStorage();
    });
    
    // Initialize character counters and restore saved inputs
    restoreInputsFromLocalStorage();
    updateCharCount(jobDescriptionInput, 'jobDescCounter');
    updateCharCount(cvTextInput, 'cvTextCounter');
    
    // Form submission handler
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const jobDescription = jobDescriptionInput.value.trim();
        const cvText = cvTextInput.value.trim();
        
        // Validate inputs
        if (!jobDescription) {
            showError('Please enter a job description');
            jobDescriptionInput.focus();
            return;
        }
        if (!cvText) {
            showError('Please enter your CV text');
            cvTextInput.focus();
            return;
        }
        
        // Get UI elements
        const submitButton = form.querySelector('.submit-button');
        const buttonText = submitButton?.querySelector('.button-text');
        const spinner = submitButton?.querySelector('.spinner');
        const progressContainer = document.querySelector('.progress-container');
        const outputSection = document.querySelector('.output-section');
        
        if (!submitButton || !buttonText || !spinner || !progressContainer || !outputSection) {
            console.error('Required UI elements not found');
            return;
        }
        
        // Show loading state
        buttonText.textContent = 'Generating...';
        submitButton.disabled = true;
        spinner.style.display = 'block';
        progressContainer.style.display = 'block';
        outputSection.style.display = 'none';
        
        // Start progress animation
        let currentStep = 0;
        const progressInterval = setInterval(() => {
            if (currentStep < progressSteps.length - 1) {
                updateProgress(currentStep);
                currentStep++;
            }
        }, 2000);
        
        try {
            const response = await fetch('https://cv-cover-letter.ukjbowman.workers.dev/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    job_description: jobDescription,
                    cv_text: cvText
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Show final progress step
            clearInterval(progressInterval);
            updateProgress(progressSteps.length - 1);
            
            // Get user details and format content
            const userDetails = extractUserDetails(cvText);
            const formattedCV = formatContent(result.role_focused_cv, 'cv', userDetails);
            const formattedLetter = formatContent(result.cover_letter, 'letter', userDetails);
            
            // Display outputs
            const cvOutput = document.getElementById('generatedCV');
            const letterOutput = document.getElementById('generatedCoverLetter');
            
            if (!cvOutput || !letterOutput) {
                throw new Error('Output elements not found');
            }
            
            cvOutput.innerHTML = formattedCV || 'No CV generated';
            letterOutput.innerHTML = formattedLetter || 'No cover letter generated';
            
            // Show output section with animation
            outputSection.style.opacity = '0';
            outputSection.style.display = 'block';
            setTimeout(() => {
                outputSection.style.opacity = '1';
            }, 50);
            
            // Smooth scroll to results
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Error during generation:', error);
            showError(`Error generating content: ${error.message}`);
            outputSection.style.display = 'none';
        } finally {
            // Reset UI state
            clearInterval(progressInterval);
            buttonText.textContent = 'Generate';
            submitButton.disabled = false;
            spinner.style.display = 'none';
            progressContainer.style.display = 'none';
            document.querySelector('.generating-state').style.display = 'none';
        }
    });
});