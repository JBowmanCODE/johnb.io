let pyodideReadyPromise;

function loadPyodideIfNeeded() {
    if (!pyodideReadyPromise) {
        pyodideReadyPromise = loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        });
    }
    return pyodideReadyPromise;
}

async function setupCalculator() {
    try {
        await loadPyodideIfNeeded();
        console.log("Pyodide loaded successfully");
        const calculateButton = document.getElementById('calculate-button');
        const inputFields = document.querySelectorAll('#calculator input');
        if (calculateButton) {
            calculateButton.addEventListener('click', calculate);
            console.log("Calculate button event listener added");
        } else {
            console.error("Calculate button not found");
        }
        inputFields.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    calculate();
                }
            });
        });
    } catch (error) {
        console.error("Error setting up calculator:", error);
    }
}

async function calculate() {
    const output = document.getElementById("output");
    const totalBill = document.getElementById("total_bill").value;
    const tipPercentage = document.getElementById("tip_percentage").value;
    const numPeople = document.getElementById("num_people").value;

    if (!output || !totalBill || !tipPercentage || !numPeople) {
        console.error('One or more required elements are missing');
        return;
    }

    try {
        const pyodide = await loadPyodideIfNeeded();
        let result = await pyodide.runPythonAsync(`
            def bill_calculator(total_bill, tip_percentage, num_people):
                total_bill = float(total_bill)
                tip_percentage = float(tip_percentage)
                num_people = int(num_people)

                total_tip = (tip_percentage / 100) * total_bill
                total_amount = total_bill + total_tip
                amount_per_person = total_amount / num_people

                return f"""
                Total bill amount: £{total_bill:.2f}
                Tip amount: £{total_tip:.2f}
                Total amount to be paid: £{total_amount:.2f}
                Each person should pay: £{amount_per_person:.2f}
                """

            result = bill_calculator(${totalBill}, ${tipPercentage}, ${numPeople})
            result
        `);
        
        output.innerText = result;
        console.log("Calculation completed");
    } catch (error) {
        console.error('Error in calculation:', error);
        output.innerText = 'An error occurred. Please check your inputs and try again.';
    }
}

document.addEventListener('DOMContentLoaded', setupCalculator);
console.log("calculator.js loaded");