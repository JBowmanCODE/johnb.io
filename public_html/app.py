from flask import Flask, render_template, request
import os

app = Flask(__name__, static_folder='', template_folder='')

def calculate_tip(total_bill, tip_percentage, num_people):
    total_tip = (tip_percentage / 100) * total_bill
    total_amount = total_bill + total_tip
    amount_per_person = total_amount / num_people
    return total_tip, total_amount, amount_per_person

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    total_bill = float(request.form['total_bill'])
    tip_percentage = float(request.form['tip_percentage'])
    num_people = int(request.form['num_people'])

    total_tip, total_amount, amount_per_person = calculate_tip(total_bill, tip_percentage, num_people)

    return render_template('result.html', total_bill=total_bill, total_tip=total_tip, total_amount=total_amount, amount_per_person=amount_per_person)

if __name__ == '__main__':
    app.run(debug=True)
