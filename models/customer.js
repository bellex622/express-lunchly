"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          notes
      FROM customers
      ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          notes
      FROM customers
      WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /**get a customer by name.
   * Returns list of customer instances, or
   * returns 404 "No such customer" error if no customer is found.
   */

  // fn name and param name is a little misleading
  // this is a searching fn, var name could be searchTerm or term..
  // search, or searchCustomer better suited name for fn
  static async getByName(name) {

    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName"
      FROM customers
      WHERE
          CONCAT(first_name,' ', last_name) ILIKE $1`,
      [`%${name}%`]
    );

    // instead of throwing err => don't return anything, blank page
    // throw alternate friendlier err
    // 404 implies the get req we made does not exist
    // searching in search bar not that specific; as user, you havent
    // made err
    if (results.rows.length === 0) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }

    return results.rows.map(c => new Customer(c));

  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
            SET first_name=$1,
                last_name=$2,
                phone=$3,
                notes=$4
            WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** Take a customer's first and last names and return first and last names
   * joined by a space
   */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // add docstring
  // formatting: in SQL add an alias for 'count' to be explicit
    // describe what's happening
    // add limit statement to next line
  static async getTopTen() {
    const results = await db.query(
      `SELECT
          c.id,
          c.first_name as "firstName",
          c.last_name as "lastName",
          count(c.id)
      FROM customers as c
          JOIN reservations as r
              ON c.id = r.customer_id
      GROUP BY c.id
      ORDER BY count DESC, first_name, last_name LIMIT 10`,
    );

    return results.rows.map(c => new Customer(c));
  }

}

module.exports = Customer;
